-- ============================================
-- Script de Creación de Tablas RIPS
-- Resolución 2275 de 2023 - Ministerio de Salud
-- BSL Plataforma
-- ============================================

-- 1. MODIFICAR TABLA EXAMENES - Agregar campos RIPS a tabla existente
-- ============================================
-- Agregar columnas RIPS si no existen
ALTER TABLE examenes
  ADD COLUMN IF NOT EXISTS codigo_cups VARCHAR(10),
  ADD COLUMN IF NOT EXISTS grupo_servicio VARCHAR(2),
  ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Índice para búsquedas rápidas por CUPS
CREATE INDEX IF NOT EXISTS idx_examenes_cups ON examenes(codigo_cups);

-- Comentarios para documentación
COMMENT ON COLUMN examenes.codigo_cups IS 'Código CUPS del procedimiento (RIPS)';
COMMENT ON COLUMN examenes.grupo_servicio IS '01=Consulta, 03=Apoyo diagnóstico, 04=Quirúrgico (RIPS)';
COMMENT ON COLUMN examenes.precio IS 'Precio del examen en COP para facturación RIPS';

-- 2. MODIFICAR TABLA MEDICOS - Agregar campos para RIPS
-- ============================================
ALTER TABLE medicos
  ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(5) DEFAULT 'CC',
  ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(20);

-- Comentarios para documentación
COMMENT ON COLUMN medicos.tipo_documento IS 'Tipo de documento del médico: CC, CE, PA, etc. (RIPS)';
COMMENT ON COLUMN medicos.numero_documento IS 'Número de cédula del médico (RIPS)';

-- 3. TABLA RIPS_CONFIGURACION - Configuración general del prestador
-- ============================================
CREATE TABLE IF NOT EXISTS rips_configuracion (
  id SERIAL PRIMARY KEY,
  nit_prestador VARCHAR(20) NOT NULL,
  nombre_prestador VARCHAR(200),
  modalidad_atencion_defecto VARCHAR(2) DEFAULT '01',  -- 01=Intramural
  finalidad_consulta_defecto VARCHAR(2) DEFAULT '13',  -- 13=Promoción y prevención
  causa_externa_defecto VARCHAR(2) DEFAULT '15',       -- 15=Otro
  via_ingreso_defecto VARCHAR(2) DEFAULT '02',         -- 02=Consulta externa
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE rips_configuracion IS 'Configuración general para generación de RIPS';
COMMENT ON COLUMN rips_configuracion.nit_prestador IS 'NIT de BSL como IPS';

-- 4. TABLA RIPS_EXPORTACIONES - Histórico de generaciones RIPS
-- ============================================
CREATE TABLE IF NOT EXISTS rips_exportaciones (
  id SERIAL PRIMARY KEY,
  fecha_generacion TIMESTAMP DEFAULT NOW(),
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  total_registros INTEGER DEFAULT 0,
  total_pacientes INTEGER DEFAULT 0,
  archivo_json TEXT,  -- JSON completo generado
  estado VARCHAR(20) DEFAULT 'generado',  -- generado, enviado, validado, rechazado
  errores_validacion TEXT,
  usuario_generador VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_rips_exportaciones_fecha ON rips_exportaciones(fecha_generacion DESC);
CREATE INDEX IF NOT EXISTS idx_rips_exportaciones_periodo ON rips_exportaciones(periodo_inicio, periodo_fin);
CREATE INDEX IF NOT EXISTS idx_rips_exportaciones_estado ON rips_exportaciones(estado);

-- Comentarios
COMMENT ON TABLE rips_exportaciones IS 'Histórico de archivos RIPS generados';
COMMENT ON COLUMN rips_exportaciones.archivo_json IS 'Archivo RIPS completo en formato JSON según Resolución 2275/2023';

-- 5. INSERTAR CONFIGURACIÓN INICIAL (si no existe)
-- ============================================
INSERT INTO rips_configuracion (
  nit_prestador,
  nombre_prestador,
  modalidad_atencion_defecto,
  finalidad_consulta_defecto,
  causa_externa_defecto,
  via_ingreso_defecto
) VALUES (
  '890111797',  -- NIT BSL
  'BSL SALUD OCUPACIONAL',
  '01',  -- Intramural
  '13',  -- Promoción y prevención
  '15',  -- Otro
  '02'   -- Consulta externa
)
ON CONFLICT DO NOTHING;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificar creación exitosa
SELECT 'Tabla examenes creada: ' || COUNT(*)::text || ' registros' FROM examenes;
SELECT 'Configuración RIPS creada: ' || COUNT(*)::text || ' registros' FROM rips_configuracion;
SELECT 'Columnas agregadas a tabla medicos: tipo_documento, numero_documento' as status;
