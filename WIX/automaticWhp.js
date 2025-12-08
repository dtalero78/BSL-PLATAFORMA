import { sendTextMessage } from 'backend/http-functions';
import { guardarMensajeWix } from 'backend/BotGuardarMensajesWix.jsw';
import wixData from 'wix-data';

export async function barridoYEnvioMensajesConDelay() {
    console.log("🚀 [barridoYEnvioMensajesConDelay] Iniciando ejecución...");
    try {
        // await limpiarDuplicados(); // Desactivado temporalmente - causa error "Operation input is too large"

        const ahora = new Date();
        // Incluir citas desde 15 minutos atrás para no perder pacientes si el job se retrasa
        const quinceMinAtras = new Date(ahora.getTime() - 15 * 60 * 1000);
        console.log(`📅 [barridoYEnvioMensajesConDelay] Buscando citas entre ${quinceMinAtras.toISOString()} y la próxima hora`);
        const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

        // Busca registros con cita desde 15 min atrás hasta la próxima hora (para no perder citas recientes)
        const chatbotResult = await wixData.query('CHATBOT')
            .ge('fechaAtencion', quinceMinAtras)
            .le('fechaAtencion', unaHoraDespues)
            .ne("atendido", "ATENDIDO")
            .find();

        console.log(`📊 [barridoYEnvioMensajesConDelay] Registros encontrados: ${chatbotResult.items.length}`);

        if (chatbotResult.items.length === 0) {
            console.log("⚠️ [barridoYEnvioMensajesConDelay] No hay registros pendientes");
            return { mensaje: 'No hay registros con fecha de atención dentro de la próxima hora.' };
        }

        const basesDeDatos = [
            { nombre: 'FORMULARIO', url: 'https://www.bsl.com.co/historia-clinica2/' },
            { nombre: 'ADCTEST', url: 'https://www.bsl.com.co/adc-preguntas2/' },
            { nombre: 'AUDIOMETRIA', url: 'https://www.bsl.com.co/audiometria2/' },
            { nombre: 'VISUAL', url: 'https://www.bsl.com.co/visual2/' }
        ];

        const delay = 500; // Reducido de 2000 a 500ms para evitar timeout
        const registros = chatbotResult.items;
        const maxRegistros = 10; // Limitar a 10 registros por ejecución para evitar timeout de 59s

        for (let i = 0; i < Math.min(registros.length, maxRegistros); i++) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            await procesarRegistro(registros[i], basesDeDatos);
        }

        if (registros.length > maxRegistros) {
            console.log(`⚠️ [barridoYEnvioMensajesConDelay] Había ${registros.length} registros, solo se procesaron ${maxRegistros}. El resto se procesará en la próxima ejecución.`);
        }

        return { mensaje: 'Registros procesados correctamente.' };
    } catch (error) {
        console.error("Error en barridoYEnvioMensajesConDelay:", error.message);
        throw new Error("Ha ocurrido un error al procesar los datos.");
    }
}

// Revisa pruebas y decide el flujo
async function procesarRegistro(registro, basesDeDatos) {
    const {
        primerNombre,
        celular,
        _id: idGeneral,
        fechaAtencion,
        pruebaPendienteRecordatorioEnviado = {}
    } = registro;

    let formularioCompletado = false;

    // 1. Revisa solo FORMULARIO
    try {
        const result = await wixData.query('FORMULARIO')
            .eq('idGeneral', idGeneral)
            .find();

        if (result.items.length > 0) {
            formularioCompletado = true;
        }
    } catch (queryError) {
        formularioCompletado = false;
    }

    if (!celular) return;
    const toNumber = `57${celular}`;

    const ahora = new Date();
    const cincoMinDespues = new Date(ahora.getTime() + 5 * 60 * 1000);
    const fechaAtencionDate = new Date(fechaAtencion);
    const minutosHastaCita = (fechaAtencionDate.getTime() - ahora.getTime()) / 60000;

    console.log(`👤 [procesarRegistro] ${primerNombre} - Celular: ${celular} - Minutos hasta cita: ${minutosHastaCita.toFixed(1)} - Formulario: ${formularioCompletado ? 'SI' : 'NO'} - RecordatorioEnviado: ${registro.recordatorioLinkEnviado ? 'SI' : 'NO'}`);

    // 2. Si FORMULARIO NO está completado, enviar mensaje de recordatorio (solo si no se ha enviado antes)
    if (!formularioCompletado) {
        if (!registro.recordatorioLinkEnviado && minutosHastaCita >= 5 && minutosHastaCita <= 15) {
            const messageBody = "Necesitamos que termines esas pruebas para continuar con tu orden médica.";
            try {
                await sendTextMessage(toNumber, messageBody);
                await guardarMensajeWix({
                    userId: celular,
                    nombre: primerNombre,
                    mensaje: messageBody,
                    from: "wix",
                    tipo: "pendiente_pruebas_en_link"
                });
                // Marcar que ya se envió el recordatorio
                await wixData.update('CHATBOT', { ...registro, recordatorioLinkEnviado: true });
                console.log(`✅ [procesarRegistro] Recordatorio enviado a ${primerNombre} y marcado`);
            } catch (sendError) {
                console.error(`Error enviando mensaje de pruebas pendientes a ${toNumber}:`, sendError);
            }
        }
        return; // Sin formulario no puede continuar al PDF
    }

    // --- FORMULARIO COMPLETADO ---
    // 3. Enviar link médico virtual (ventana: 5-15 minutos antes, solo si no se ha enviado antes)
    if (!registro.recordatorioLinkEnviado && minutosHastaCita >= 5 && minutosHastaCita <= 15) {
        const url = `https://sea-lion-app-qcttp.ondigitalocean.app/?_id=${idGeneral}`;
        const messageBody = `Comunícate ya haciendo clic en este link.\n\n${url}`;
        try {
            await sendTextMessage(toNumber, messageBody);
            // Marcar que ya se envió el recordatorio
            await wixData.update('CHATBOT', { ...registro, recordatorioLinkEnviado: true });
            console.log(`✅ [procesarRegistro] Link médico enviado a ${primerNombre} y marcado`);
        } catch (sendError) {
            console.error(`Error enviando link médico virtual a ${toNumber}:`, sendError);
        }
    }

    // 4. Certificado y PDF: desde 15 min después de la cita hasta 5 min antes
    // Ventana ampliada para no perder pacientes si el job se retrasa
    console.log(`🔍 [procesarRegistro] ${primerNombre} - Verificando ventana certificado: ${minutosHastaCita.toFixed(1)} min (debe ser entre -15 y 5)`);
    if (
        minutosHastaCita >= -15 && minutosHastaCita <= 5
    ) {
        console.log(`📄 [procesarRegistro] ${primerNombre} - ENTRANDO a generar certificado`);
        try {
            const chatbotItem = await wixData.get('CHATBOT', idGeneral);
            chatbotItem.pruebasFinalizadas = true;
            chatbotItem.atendido = "ATENDIDO";
            await wixData.update('CHATBOT', chatbotItem);
        } catch (sendError) {
            console.error(`Error haciendo el update a ${toNumber}:`, sendError);
        }

        const actualizacionOK = await actualizarHistoriaClinica(idGeneral);

        if (actualizacionOK) {
            try {
                const pdfUrl = await generarPdfDesdeApi2Pdf(idGeneral);
                await sendPdf(toNumber, pdfUrl, idGeneral);
                await guardarMensajeWix({
                    userId: celular,
                    nombre: primerNombre,
                    mensaje: `Certificado médico enviado en PDF: ${pdfUrl}`,
                    from: "wix",
                    tipo: "certificado_enviado"
                });
                // NUEVO MENSAJE AQUÍ
                const mensajePago = "Revisa que todo esté en orden";
                await sendTextMessage(toNumber, mensajePago);
                await guardarMensajeWix({
                    userId: celular,
                    nombre: primerNombre,
                    mensaje: mensajePago,
                    from: "wix",
                    tipo: "mensaje_pago"
                });
                // ACTUALIZAR OBSERVACIONES EN WHP
                try {
                    const whpResult = await wixData.query('WHP')
                        .eq('userId', `57${celular}`)
                        .find();

                    if (whpResult.items.length > 0) {
                        let whpItem = whpResult.items[0];
                        whpItem.observaciones = "";
                        whpItem.nivel = 2;
                        whpItem.stopBot = true;
                        await wixData.update('WHP', whpItem);
                        console.log(`Observaciones limpiadas, nivel actualizado a 2 y stop=true para celular: ${celular}`);
                        
                        // Enviar mensaje de pago del bot
                        const mensajePagoBot = `Paga $46.000 en las siguientes cuentas:\n\n*Bancolombia*\nCta Ahorros: 442 9119 2456\nCédula: 79 981 585\n\n*Daviplata:* 301 440 0818\n\n*Nequi:* 300 802 1701\n\nCuándo lo hagas *envía el soporte de pago por acá*`;
                        await sendTextMessage(toNumber, mensajePagoBot);
                        await guardarMensajeWix({
                            userId: celular,
                            nombre: primerNombre,
                            mensaje: mensajePagoBot,
                            from: "wix",
                            tipo: "mensaje_pago_bot"
                        });
                    } else {
                        console.log(`No se encontró registro en WHP para userId: ${celular}`);
                    }
                } catch (obsError) {
                    console.error(`Error actualizando observaciones en WHP para ${celular}:`, obsError);
                }
            } catch (sendError) {
                console.error(`Error enviando pdf a ${toNumber}:`, sendError);
            }
        }

        return;
    }
}

// ==========================================
// BARRIDO HISTORIA CLÍNICA - Recordatorio 1 hora antes (excepto SANITHELP-JJ)
// ==========================================
export async function barridoHistoriaClinicaRecordatorio() {
    try {
        const ahora = new Date();
        const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

        // Busca registros en HistoriaClinica con fechaAtencion dentro de la próxima hora
        // Excluye SANITHELP-JJ y solo toma los no atendidos
        const historiaResult = await wixData.query('HistoriaClinica')
            .ge('fechaAtencion', ahora)
            .le('fechaAtencion', unaHoraDespues)
            .ne('codEmpresa', 'SANITHELP-JJ')
            .ne('atendido', 'ATENDIDO')
            .find();

        if (historiaResult.items.length === 0) {
            console.log('No hay registros con fecha de atención dentro de la próxima hora.');
            return { mensaje: 'No hay registros pendientes.' };
        }

        console.log(`Encontrados ${historiaResult.items.length} registros para procesar.`);

        const delay = 2000;
        const registros = historiaResult.items;

        for (let i = 0; i < registros.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            await procesarRegistroHistoria(registros[i]);
        }

        return { mensaje: 'Registros procesados correctamente.' };
    } catch (error) {
        console.error("Error en barridoHistoriaClinicaRecordatorio:", error.message);
        throw new Error("Ha ocurrido un error al procesar los datos.");
    }
}

async function procesarRegistroHistoria(registro) {
    const {
        primerNombre,
        celular,
        numeroId,
        _id: historiaId
    } = registro;

    if (!celular) {
        console.log(`Registro ${historiaId} sin celular, saltando...`);
        return;
    }

    // Verificar si completó el FORMULARIO
    let formularioCompletado = false;
    try {
        const result = await wixData.query('FORMULARIO')
            .eq('documentoIdentidad', numeroId)
            .find();

        if (result.items.length > 0) {
            formularioCompletado = true;
        }
    } catch (queryError) {
        console.error(`Error consultando FORMULARIO para ${numeroId}:`, queryError);
        formularioCompletado = false;
    }

    // Si NO completó el formulario, enviar link de desbloqueo
    if (!formularioCompletado) {
        const telefonoLimpio = celular.replace(/\s+/g, '');
        const toNumber = telefonoLimpio.startsWith('57') ? telefonoLimpio : `57${telefonoLimpio}`;

        const desbloqueoUrl = 'https://www.bsl.com.co/desbloqueo';
        const messageBody = `Hola ${primerNombre}: Te escribimos de BSL. Tienes una cita médico ocupacional. Para continuar debes completar el formulario en el siguiente enlace:\n\n${desbloqueoUrl}`;

        try {
            await sendTextMessage(toNumber, messageBody);
            await guardarMensajeWix({
                userId: celular,
                nombre: primerNombre,
                mensaje: messageBody,
                from: "wix",
                tipo: "recordatorio_formulario"
            });
            console.log(`✅ Recordatorio enviado a ${primerNombre} (${toNumber})`);
        } catch (sendError) {
            console.error(`Error enviando recordatorio a ${toNumber}:`, sendError);
        }
    } else {
        console.log(`${primerNombre} ya completó el formulario, no se envía recordatorio.`);
    }
}

// ==========================================
// BARRIDO NUBIA - Marcar como ATENDIDO citas pasadas
// Para consultas presenciales con médico NUBIA
// ==========================================
export async function barridoNubiaMarcarAtendido() {
    console.log("🚀 [barridoNubiaMarcarAtendido] Iniciando ejecución...");
    try {
        const ahora = new Date();
        // Buscar citas desde 2 horas atrás hasta 5 minutos atrás (ya pasaron)
        const dosHorasAtras = new Date(ahora.getTime() - 120 * 60 * 1000);
        const cincoMinAtras = new Date(ahora.getTime() - 5 * 60 * 1000);

        console.log(`📅 [barridoNubiaMarcarAtendido] Buscando citas de NUBIA entre ${dosHorasAtras.toISOString()} y ${cincoMinAtras.toISOString()}`);

        // Busca registros en HistoriaClinica con médico NUBIA que no estén atendidos
        // y cuya fecha de atención ya pasó (entre 2 horas atrás y 5 min atrás)
        const historiaResult = await wixData.query('HistoriaClinica')
            .ge('fechaAtencion', dosHorasAtras)
            .le('fechaAtencion', cincoMinAtras)
            .contains('medico', 'NUBIA')
            .ne('atendido', 'ATENDIDO')
            .find();

        console.log(`📊 [barridoNubiaMarcarAtendido] Registros encontrados: ${historiaResult.items.length}`);

        if (historiaResult.items.length === 0) {
            console.log("⚠️ [barridoNubiaMarcarAtendido] No hay registros de NUBIA pendientes por marcar");
            return { mensaje: 'No hay registros de NUBIA pendientes.' };
        }

        const delay = 500;
        const registros = historiaResult.items;
        const maxRegistros = 20; // Limitar por ejecución
        let procesados = 0;

        for (let i = 0; i < Math.min(registros.length, maxRegistros); i++) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            await procesarRegistroNubia(registros[i]);
            procesados++;
        }

        if (registros.length > maxRegistros) {
            console.log(`⚠️ [barridoNubiaMarcarAtendido] Había ${registros.length} registros, solo se procesaron ${maxRegistros}. El resto se procesará en la próxima ejecución.`);
        }

        console.log(`✅ [barridoNubiaMarcarAtendido] Procesados ${procesados} registros`);
        return { mensaje: `Procesados ${procesados} registros de NUBIA.` };
    } catch (error) {
        console.error("Error en barridoNubiaMarcarAtendido:", error.message);
        throw new Error("Ha ocurrido un error al procesar los datos de NUBIA.");
    }
}

async function procesarRegistroNubia(registro) {
    const {
        primerNombre,
        primerApellido,
        celular,
        _id: historiaId,
        fechaAtencion,
        medico
    } = registro;

    const ahora = new Date();
    const fechaAtencionDate = new Date(fechaAtencion);
    const minutosDesdesCita = (ahora.getTime() - fechaAtencionDate.getTime()) / 60000;

    console.log(`👤 [procesarRegistroNubia] ${primerNombre} ${primerApellido || ''} - Médico: ${medico} - Minutos desde cita: ${minutosDesdesCita.toFixed(1)}`);

    // Si ya pasó la cita (más de 5 minutos), marcar como ATENDIDO
    if (minutosDesdesCita >= 5) {
        try {
            // Actualizar el registro en HistoriaClinica
            const historiaItem = await wixData.get('HistoriaClinica', historiaId);
            historiaItem.atendido = "ATENDIDO";
            await wixData.update('HistoriaClinica', historiaItem);

            console.log(`✅ [procesarRegistroNubia] Marcado como ATENDIDO: ${primerNombre} ${primerApellido || ''} (ID: ${historiaId})`);

            // Enviar mensaje de confirmación si tiene celular
            if (celular) {
                const telefonoLimpio = celular.replace(/\s+/g, '');
                const toNumber = telefonoLimpio.startsWith('57') ? telefonoLimpio : `57${telefonoLimpio}`;

                // Enviar mensaje de WhatsApp al paciente
                const messageBody = `Hola ${primerNombre}, gracias por asistir a tu cita médico ocupacional con la Dra. Nubia. Tu certificado será enviado pronto. ¡Que tengas un excelente día!`;

                try {
                    await sendTextMessage(toNumber, messageBody);
                    await guardarMensajeWix({
                        userId: celular,
                        nombre: primerNombre,
                        mensaje: messageBody,
                        from: "wix",
                        tipo: "confirmacion_atendido_nubia"
                    });
                    console.log(`📱 [procesarRegistroNubia] Mensaje enviado a ${primerNombre} (${toNumber})`);
                } catch (sendError) {
                    console.error(`Error enviando mensaje a ${toNumber}:`, sendError);
                }
            }
        } catch (updateError) {
            console.error(`Error actualizando registro de NUBIA ${historiaId}:`, updateError);
        }
    } else {
        console.log(`⏳ [procesarRegistroNubia] ${primerNombre} - Aún no han pasado 5 minutos desde la cita`);
    }
}