-- ====================================================================
-- Migration: Índices de Performance y Constraint UNIQUE para WhatsApp
-- Fecha: 21-ene-2026
-- Propósito:
--   1. Optimizar queries de conversaciones WhatsApp
--   2. Prevenir duplicados con constraint UNIQUE en celular
-- ====================================================================

-- IMPORTANTE: Este script debe ejecutarse DESPUÉS de consolidar duplicados
-- Si hay duplicados, el constraint UNIQUE fallará
-- Verificar primero con: node verificar-duplicados-actuales.js

-- ====================================================================
-- PARTE 1: Índices para HistoriaClinica (Optimización de Performance)
-- ====================================================================

-- Índice para búsqueda de celular en webhook y conversaciones
CREATE INDEX IF NOT EXISTS idx_historia_celular
ON "HistoriaClinica"("celular");

-- Índice compuesto para búsqueda de celular + empresa
CREATE INDEX IF NOT EXISTS idx_historia_celular_empresa
ON "HistoriaClinica"("celular", "codEmpresa");

COMMENT ON INDEX idx_historia_celular IS 'Optimiza búsqueda de empresa en webhook de Twilio';
COMMENT ON INDEX idx_historia_celular_empresa IS 'Optimiza JOIN con HistoriaClinica en endpoint GET conversaciones';

-- ====================================================================
-- PARTE 2: Índices para mensajes_whatsapp (Optimización de Performance)
-- ====================================================================

-- Índice para status callbacks de Twilio (busca por sid_twilio)
CREATE INDEX IF NOT EXISTS idx_msg_sid_twilio
ON mensajes_whatsapp(sid_twilio);

-- Índice compuesto para cargar mensajes de una conversación ordenados por fecha
CREATE INDEX IF NOT EXISTS idx_msg_conv_timestamp
ON mensajes_whatsapp(conversacion_id, timestamp DESC);

COMMENT ON INDEX idx_msg_sid_twilio IS 'Optimiza status callbacks de Twilio (cada mensaje enviado)';
COMMENT ON INDEX idx_msg_conv_timestamp IS 'Optimiza carga de mensajes de una conversación';

-- ====================================================================
-- PARTE 3: Índices GIN para búsqueda ILIKE (Full-Text Search)
-- ====================================================================

-- Habilitar extensión pg_trgm para búsqueda de texto eficiente
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN trigram para búsqueda en contenido de mensajes
CREATE INDEX IF NOT EXISTS idx_msg_contenido_trgm
ON mensajes_whatsapp USING gin(contenido gin_trgm_ops);

-- Índice GIN trigram para búsqueda en nombre de paciente
CREATE INDEX IF NOT EXISTS idx_conv_nombre_trgm
ON conversaciones_whatsapp USING gin(nombre_paciente gin_trgm_ops);

COMMENT ON INDEX idx_msg_contenido_trgm IS 'Optimiza búsqueda ILIKE en contenido de mensajes';
COMMENT ON INDEX idx_conv_nombre_trgm IS 'Optimiza búsqueda ILIKE en nombre de paciente';

-- ====================================================================
-- PARTE 4: Índices adicionales para conversaciones_whatsapp
-- ====================================================================

-- Índice para búsqueda por estado y fecha (usado en filtros del panel)
CREATE INDEX IF NOT EXISTS idx_conv_estado_fecha
ON conversaciones_whatsapp(estado, fecha_ultima_actividad DESC);

-- Índice para búsqueda de conversaciones de un paciente específico
CREATE INDEX IF NOT EXISTS idx_conv_paciente_id
ON conversaciones_whatsapp(paciente_id)
WHERE paciente_id IS NOT NULL;

COMMENT ON INDEX idx_conv_estado_fecha IS 'Optimiza filtrado de conversaciones por estado';
COMMENT ON INDEX idx_conv_paciente_id IS 'Optimiza búsqueda de conversaciones de un paciente';

-- ====================================================================
-- PARTE 5: CONSTRAINT UNIQUE para prevenir duplicados (CRÍTICO)
-- ====================================================================

-- ⚠️  ADVERTENCIA: Este constraint fallará si existen duplicados
-- Ejecutar DESPUÉS de consolidar con: node consolidar-duplicados-whatsapp.js

-- Crear índice UNIQUE en celular para prevenir duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_celular_unique
ON conversaciones_whatsapp(celular);

COMMENT ON INDEX idx_conv_celular_unique IS 'CRÍTICO: Previene duplicados de números telefónicos (573XXX vs +573XXX)';

-- ====================================================================
-- Verificación de índices creados
-- ====================================================================

-- Ejecutar esta query para verificar que todos los índices fueron creados:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('conversaciones_whatsapp', 'mensajes_whatsapp', 'HistoriaClinica')
-- ORDER BY tablename, indexname;

-- ====================================================================
-- Estadísticas esperadas
-- ====================================================================

-- Actualizar estadísticas de las tablas para que el query planner use los índices
ANALYZE "HistoriaClinica";
ANALYZE conversaciones_whatsapp;
ANALYZE mensajes_whatsapp;

-- ====================================================================
-- FIN DE MIGRATION
-- ====================================================================
