/**
 * Generador de RIPS JSON según Resolución 2275 de 2023
 * Ministerio de Salud y Protección Social - Colombia
 *
 * Este módulo genera archivos RIPS en formato JSON para reportar
 * servicios de salud ocupacional prestados por BSL.
 */

// El pool se pasará como parámetro desde server.js
let pool = null;

/**
 * Mapeo de ciudades colombianas a códigos DANE
 * Top 20 ciudades principales (expandir según necesidad)
 */
const MUNICIPIOS_DANE = {
  'BOGOTA': '11001',
  'BOGOTÁ': '11001',
  'MEDELLIN': '05001',
  'MEDELLÍN': '05001',
  'CALI': '76001',
  'BARRANQUILLA': '08001',
  'CARTAGENA': '13001',
  'CUCUTA': '54001',
  'CÚCUTA': '54001',
  'BUCARAMANGA': '68001',
  'PEREIRA': '66001',
  'SANTA MARTA': '47001',
  'IBAGUE': '73001',
  'IBAGUÉ': '73001',
  'PASTO': '52001',
  'MANIZALES': '17001',
  'NEIVA': '41001',
  'VILLAVICENCIO': '50001',
  'ARMENIA': '63001',
  'VALLEDUPAR': '20001',
  'MONTERIA': '23001',
  'MONTERÍA': '23001',
  'SINCELEJO': '70001'
};

/**
 * Obtiene el código DANE de un municipio
 * @param {string} ciudad - Nombre de la ciudad
 * @returns {string} Código DANE
 */
function obtenerCodigoDane(ciudad) {
  if (!ciudad) return '11001'; // Default: Bogotá

  const ciudadUpper = ciudad.toUpperCase().trim();
  return MUNICIPIOS_DANE[ciudadUpper] || '11001';
}

/**
 * Mapea género del sistema a código RIPS
 * @param {string} genero - Género del sistema
 * @returns {string} Código: M, F, I (indeterminado)
 */
function mapearGenero(genero) {
  if (!genero) return 'M';

  const generoLower = genero.toLowerCase();
  if (generoLower.includes('masc') || generoLower === 'm') return 'M';
  if (generoLower.includes('fem') || generoLower === 'f') return 'F';
  return 'I'; // Indeterminado
}

/**
 * Formatea fecha a YYYY-MM-DD
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function formatearFecha(fecha) {
  if (!fecha) return null;

  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formatea hora a HH:MM
 * @param {Date|string} fecha - Fecha/hora a formatear
 * @returns {string} Hora en formato HH:MM
 */
function formatearHora(fecha) {
  if (!fecha) {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(date.getTime())) {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Normaliza texto para RIPS (mayúsculas, sin tildes, sin caracteres especiales)
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizarTexto(texto) {
  if (!texto) return '';

  return texto
    .toString()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^A-Z0-9\s]/g, '') // Solo letras, números y espacios
    .trim();
}

/**
 * Obtiene la configuración RIPS del sistema
 * @returns {Promise<Object>} Configuración RIPS
 */
async function obtenerConfiguracionRIPS() {
  const result = await pool.query('SELECT * FROM rips_configuracion LIMIT 1');

  if (result.rows.length === 0) {
    throw new Error('No existe configuración RIPS. Ejecute el script crear-tablas-rips.sql');
  }

  return result.rows[0];
}

/**
 * Obtiene los exámenes realizados y calcula el precio total
 * @param {string} examenesStr - String de exámenes separados por coma o JSON
 * @returns {Promise<Object>} { examenes: Array, precioTotal: Number, cupsNoConfigurados: Array }
 */
async function procesarExamenes(examenesStr) {
  let listaExamenes = [];

  // Parsear string de exámenes
  try {
    if (examenesStr && examenesStr.startsWith('[')) {
      listaExamenes = JSON.parse(examenesStr);
    } else if (examenesStr) {
      listaExamenes = examenesStr.split(',').map(e => e.trim()).filter(e => e);
    }
  } catch (e) {
    if (examenesStr) {
      listaExamenes = examenesStr.split(',').map(e => e.trim()).filter(e => e);
    }
  }

  if (listaExamenes.length === 0) {
    listaExamenes = ['Examen Médico Ocupacional'];
  }

  // Buscar precios y códigos CUPS de los exámenes
  const examenesConDatos = [];
  const cupsNoConfigurados = [];
  let precioTotal = 0;

  for (const nombreExamen of listaExamenes) {
    const result = await pool.query(
      'SELECT * FROM examenes WHERE nombre ILIKE $1',
      [nombreExamen]
    );

    if (result.rows.length > 0) {
      const examen = result.rows[0];
      examenesConDatos.push(examen);
      precioTotal += parseFloat(examen.precio) || 0;

      // Verificar si tiene CUPS configurado
      if (!examen.codigo_cups) {
        cupsNoConfigurados.push(nombreExamen);
      }
    } else {
      // Examen no existe en tabla, agregarlo a lista de no configurados
      cupsNoConfigurados.push(nombreExamen);
    }
  }

  return {
    examenes: examenesConDatos,
    precioTotal: Math.round(precioTotal),
    cupsNoConfigurados
  };
}

/**
 * Obtiene datos del médico desde la tabla medicos
 * @param {string} nombreMedico - Nombre completo del médico
 * @returns {Promise<Object>} Datos del médico
 */
async function obtenerDatosMedico(nombreMedico) {
  if (!nombreMedico) {
    return {
      tipo_documento: 'CC',
      numero_documento: null
    };
  }

  const result = await pool.query(`
    SELECT tipo_documento, numero_documento
    FROM medicos
    WHERE CONCAT(primer_nombre, ' ', primer_apellido) ILIKE $1
       OR CONCAT(primer_nombre, ' ', segundo_nombre, ' ', primer_apellido) ILIKE $1
       OR CONCAT(primer_nombre, ' ', primer_apellido, ' ', segundo_apellido) ILIKE $1
    LIMIT 1
  `, [nombreMedico]);

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Médico no encontrado, retornar valores por defecto
  return {
    tipo_documento: 'CC',
    numero_documento: null
  };
}

/**
 * Genera la sección de transacción del RIPS
 * @param {Object} config - Configuración RIPS
 * @param {number} totalRegistros - Total de registros
 * @returns {Object} Objeto transacción
 */
function generarTransaccion(config, totalRegistros) {
  const fecha = new Date();
  const consecutivo = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;

  return {
    consecutivo: consecutivo,
    tipoNota: null,
    numDocumentoIdObligado: config.nit_prestador,
    numFactura: `RIPS-${consecutivo}`,
    fechaExpedicion: formatearFecha(fecha),
    horaExpedicion: formatearHora(fecha)
  };
}

/**
 * Genera la sección de usuarios del RIPS
 * @param {Array} registros - Registros de HistoriaClinica
 * @returns {Array} Array de usuarios únicos
 */
function generarUsuarios(registros) {
  const usuariosMap = new Map();
  let consecutivo = 1;

  for (const registro of registros) {
    const numeroId = registro.numeroId || registro.numero_id;

    if (!numeroId || usuariosMap.has(numeroId)) {
      continue; // Saltar duplicados
    }

    usuariosMap.set(numeroId, {
      tipoDocumentoIdentificacion: 'CC', // TODO: Capturar en formulario
      numDocumentoIdentificacion: numeroId,
      primerApellido: normalizarTexto(registro.primerApellido || registro.primer_apellido || ''),
      segundoApellido: normalizarTexto(registro.segundoApellido || registro.segundo_apellido || ''),
      primerNombre: normalizarTexto(registro.primerNombre || registro.primer_nombre || ''),
      segundoNombre: normalizarTexto(registro.segundoNombre || registro.segundo_nombre || ''),
      fechaNacimiento: formatearFecha(registro.fecha_nacimiento),
      codSexo: mapearGenero(registro.genero),
      codPaisOrigen: '170', // Colombia
      codPaisResidencia: '170',
      codMunicipioResidencia: obtenerCodigoDane(registro.ciudad_residencia || registro.ciudad),
      codZonaTerritorialResidencia: 'U', // Urbana por defecto
      incapacidad: 'NO',
      consecutivo: String(consecutivo++),
      tipoUsuario: '01' // Cotizante por defecto
    });
  }

  return Array.from(usuariosMap.values());
}

/**
 * Genera la sección de consultas del RIPS
 * @param {Array} registros - Registros de HistoriaClinica con datos de exámenes
 * @param {Object} config - Configuración RIPS
 * @returns {Promise<Object>} { consultas: Array, errores: Array }
 */
async function generarConsultas(registros, config) {
  const consultas = [];
  const errores = [];
  let consecutivo = 1;

  for (const registro of registros) {
    // Procesar exámenes y calcular precio
    const { examenes, precioTotal, cupsNoConfigurados } = await procesarExamenes(registro.examenes);

    // Si hay exámenes sin CUPS configurado, agregar a errores
    if (cupsNoConfigurados.length > 0) {
      errores.push({
        paciente: `${registro.primerNombre} ${registro.primerApellido}`,
        numeroId: registro.numeroId,
        examenesNoConfigurados: cupsNoConfigurados
      });
    }

    // Obtener datos del médico
    const datosMedico = await obtenerDatosMedico(registro.medico);

    // Crear una consulta por cada examen (o una general si no hay exámenes específicos)
    if (examenes.length === 0) {
      consultas.push({
        numDocumentoIdentificacion: registro.numeroId,
        fechaInicioAtencion: formatearFecha(registro.fechaAtencion),
        numAutorizacion: null,
        codConsulta: '890201', // Código genérico consulta medicina laboral
        modalidadGrupoServicioTecSal: config.modalidad_atencion_defecto || '01',
        grupoServicios: '01', // Consulta
        codServicio: '890201',
        finalidadTecnologiaSalud: config.finalidad_consulta_defecto || '13',
        causaMotivoAtencion: config.causa_externa_defecto || '15',
        codDiagnosticoPrincipal: registro.mdDx1 || 'Z571', // Z571 = Examen médico ocupacional
        codDiagnosticoRelacionado1: registro.mdDx2 || null,
        codDiagnosticoRelacionado2: null,
        codDiagnosticoRelacionado3: null,
        tipoDiagnosticoPrincipal: '01', // Impresión diagnóstica
        tipoDocumentoIdentificacion: datosMedico.tipo_documento || 'CC',
        numDocumentoIdentificacion: datosMedico.numero_documento || '0',
        vrServicio: precioTotal || 0,
        conceptoRecaudo: null,
        valorPagoModerador: 0,
        numFEVPagoModerador: null,
        consecutivo: String(consecutivo++)
      });
    } else {
      // Crear una consulta por cada examen
      for (const examen of examenes) {
        consultas.push({
          numDocumentoIdentificacion: registro.numeroId,
          fechaInicioAtencion: formatearFecha(registro.fechaAtencion),
          numAutorizacion: null,
          codConsulta: examen.codigo_cups || '890201',
          modalidadGrupoServicioTecSal: config.modalidad_atencion_defecto || '01',
          grupoServicios: examen.grupo_servicio || '01',
          codServicio: examen.codigo_cups || '890201',
          finalidadTecnologiaSalud: config.finalidad_consulta_defecto || '13',
          causaMotivoAtencion: config.causa_externa_defecto || '15',
          codDiagnosticoPrincipal: registro.mdDx1 || 'Z571',
          codDiagnosticoRelacionado1: registro.mdDx2 || null,
          codDiagnosticoRelacionado2: null,
          codDiagnosticoRelacionado3: null,
          tipoDiagnosticoPrincipal: '01',
          tipoDocumentoIdentificacion: datosMedico.tipo_documento || 'CC',
          numDocumentoIdentificacion: datosMedico.numero_documento || '0',
          vrServicio: Math.round(parseFloat(examen.precio) || 0),
          conceptoRecaudo: null,
          valorPagoModerador: 0,
          numFEVPagoModerador: null,
          consecutivo: String(consecutivo++)
        });
      }
    }
  }

  return { consultas, errores };
}

/**
 * Genera el archivo RIPS JSON completo
 * @param {string} fechaInicio - Fecha inicio periodo (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha fin periodo (YYYY-MM-DD)
 * @returns {Promise<Object>} { rips: Object, metadata: Object }
 */
async function generarRIPSJSON(fechaInicio, fechaFin) {
  console.log(`\n🏥 Generando RIPS para periodo ${fechaInicio} - ${fechaFin}`);

  // 1. Obtener configuración
  const config = await obtenerConfiguracionRIPS();
  console.log(`✓ Configuración cargada: ${config.nombre_prestador} (NIT: ${config.nit_prestador})`);

  // 2. Consultar registros atendidos en el periodo
  const result = await pool.query(`
    SELECT
      hc.*,
      f.genero,
      f.fecha_nacimiento,
      f.ciudad_residencia,
      f.primer_nombre,
      f.primer_apellido,
      f.segundo_nombre,
      f.segundo_apellido,
      f.numero_id
    FROM "HistoriaClinica" hc
    LEFT JOIN formularios f ON hc."numeroId" = f.numero_id
    WHERE hc."fechaAtencion" BETWEEN $1 AND $2
      AND hc.atendido = 'ATENDIDO'
    ORDER BY hc."fechaAtencion"
  `, [fechaInicio, fechaFin]);

  const registros = result.rows;
  console.log(`✓ Encontrados ${registros.length} registros atendidos`);

  if (registros.length === 0) {
    return {
      rips: null,
      metadata: {
        totalRegistros: 0,
        totalPacientes: 0,
        errores: ['No se encontraron registros atendidos en el periodo especificado']
      }
    };
  }

  // 3. Generar secciones del RIPS
  console.log('⚙️  Generando sección: Transacción...');
  const transaccion = generarTransaccion(config, registros.length);

  console.log('⚙️  Generando sección: Usuarios...');
  const usuarios = generarUsuarios(registros);

  console.log('⚙️  Generando sección: Consultas...');
  const { consultas, errores } = await generarConsultas(registros, config);

  // 4. Ensamblar JSON RIPS
  const ripsJSON = {
    transaccion,
    usuarios,
    consultas,
    procedimientos: [],
    urgencias: [],
    hospitalizacion: [],
    recienNacidos: [],
    medicamentos: [],
    otrosServicios: []
  };

  // 5. Metadata
  const metadata = {
    totalRegistros: registros.length,
    totalPacientes: usuarios.length,
    totalConsultas: consultas.length,
    periodoInicio: fechaInicio,
    periodoFin: fechaFin,
    fechaGeneracion: new Date().toISOString(),
    errores: errores.length > 0 ? errores : null
  };

  console.log(`✓ RIPS generado exitosamente:`);
  console.log(`  - ${usuarios.length} pacientes únicos`);
  console.log(`  - ${consultas.length} consultas/procedimientos`);

  if (errores.length > 0) {
    console.log(`\n⚠️  ADVERTENCIA: ${errores.length} pacientes tienen exámenes sin código CUPS configurado`);
  }

  return {
    rips: ripsJSON,
    metadata
  };
}

/**
 * Guarda la exportación RIPS en la base de datos
 * @param {Object} rips - Objeto RIPS generado
 * @param {Object} metadata - Metadata de la generación
 * @param {string} usuarioGenerador - Usuario que generó el RIPS
 * @returns {Promise<number>} ID de la exportación
 */
async function guardarExportacion(rips, metadata, usuarioGenerador = 'SYSTEM') {
  const erroresJSON = metadata.errores ? JSON.stringify(metadata.errores) : null;

  const result = await pool.query(`
    INSERT INTO rips_exportaciones (
      periodo_inicio,
      periodo_fin,
      total_registros,
      total_pacientes,
      archivo_json,
      estado,
      errores_validacion,
      usuario_generador
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    metadata.periodoInicio,
    metadata.periodoFin,
    metadata.totalRegistros,
    metadata.totalPacientes,
    JSON.stringify(rips),
    erroresJSON ? 'generado_con_advertencias' : 'generado',
    erroresJSON,
    usuarioGenerador
  ]);

  return result.rows[0].id;
}

/**
 * Inicializa el módulo con la conexión a la base de datos
 * @param {Object} dbPool - Instancia de pg.Pool
 */
function init(dbPool) {
  pool = dbPool;
}

module.exports = {
  init,
  generarRIPSJSON,
  guardarExportacion,
  obtenerConfiguracionRIPS,
  procesarExamenes,
  obtenerDatosMedico,
  // Utilidades exportadas
  formatearFecha,
  formatearHora,
  normalizarTexto,
  mapearGenero,
  obtenerCodigoDane
};
