-- Script para desmontar el sistema multi-agente de WhatsApp
-- Ejecutar con: psql -h HOST -U USER -d DATABASE -f scripts/desmontar-sistema-chat.sql

BEGIN;

-- Eliminar tablas relacionadas con agentes humanos
DROP TABLE IF EXISTS transferencias_conversacion CASCADE;
DROP TABLE IF EXISTS mensajes_whatsapp CASCADE;
DROP TABLE IF EXISTS reglas_enrutamiento CASCADE;
DROP TABLE IF EXISTS agentes_estado CASCADE;

-- Simplificar conversaciones_whatsapp (mantener solo campos necesarios para stopBot)
-- Eliminar columnas relacionadas con agentes humanos
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS asignado_a CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS estado CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS canal CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS bot_activo CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS nivel_bot CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS nombre_paciente CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS etiquetas CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS prioridad CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS fecha_inicio CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS fecha_ultima_actividad CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS fecha_asignacion CASCADE;
ALTER TABLE conversaciones_whatsapp DROP COLUMN IF EXISTS fecha_cierre CASCADE;

-- Mantener solo: id, celular, paciente_id, wix_chatbot_id, wix_whp_id, sincronizado_wix, stopBot, origen

-- Eliminar índices que ya no se necesitan
DROP INDEX IF EXISTS idx_conv_asignado;
DROP INDEX IF EXISTS idx_conv_estado;
DROP INDEX IF EXISTS idx_conv_ultima_actividad;
DROP INDEX IF EXISTS unique_celular_activa;

-- Mantener: idx_conv_celular, idx_conv_stopbot, idx_conv_wix_id

-- Eliminar permisos del sistema de chat (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permisos') THEN
        DELETE FROM permisos WHERE codigo IN (
            'CHAT_VER_CONVERSACIONES',
            'CHAT_RESPONDER',
            'CHAT_TRANSFERIR',
            'CHAT_ACTIVAR_BOT',
            'CHAT_CERRAR',
            'CHAT_VER_TODAS'
        );
    END IF;
END $$;

-- Eliminar usuarios con roles agente_chat y supervisor_chat
DELETE FROM usuarios WHERE rol IN ('agente_chat', 'supervisor_chat');

-- Eliminar los roles del constraint (para limpiar la base de datos)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
    CHECK (rol IN ('empresa', 'admin', 'empleado', 'usuario_ips'));

COMMIT;
