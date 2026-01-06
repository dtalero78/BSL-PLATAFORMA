# Resumen del Desmonte del Sistema Multi-Agente de WhatsApp

## Fecha: 2026-01-06

## Elementos Eliminados

### 1. Base de Datos

#### Tablas Eliminadas Completamente:
- ✅ `transferencias_conversacion` - Historial de transferencias entre agentes
- ✅ `mensajes_whatsapp` - Mensajes de conversaciones
- ✅ `reglas_enrutamiento` - Reglas de enrutamiento bot/humano
- ✅ `agentes_estado` - Estado de agentes en tiempo real

#### Tabla Simplificada:
- ✅ `conversaciones_whatsapp` - **Mantenida pero simplificada**
  - **Columnas eliminadas:** asignado_a, estado, canal, bot_activo, nivel_bot, nombre_paciente, etiquetas, prioridad, fecha_inicio, fecha_ultima_actividad, fecha_asignacion, fecha_cierre
  - **Columnas mantenidas:** id, celular, paciente_id, wix_chatbot_id, wix_whp_id, sincronizado_wix, **stopBot**, origen

#### Permisos Eliminados:
- ✅ CHAT_VER_CONVERSACIONES
- ✅ CHAT_RESPONDER
- ✅ CHAT_TRANSFERIR
- ✅ CHAT_ACTIVAR_BOT
- ✅ CHAT_CERRAR
- ✅ CHAT_VER_TODAS

#### Usuarios Eliminados:
- ✅ 2 usuarios con rol `agente_chat` y `supervisor_chat` eliminados

#### Constraints Actualizados:
- ✅ Constraint `usuarios_rol_check` actualizado para **NO** incluir `agente_chat` ni `supervisor_chat`
- ✅ Roles válidos ahora: `empresa`, `admin`, `empleado`, `usuario_ips`

---

### 2. Archivos Frontend Eliminados

- ✅ `public/panel-agentes.html` - Panel de agentes de chat
- ✅ `public/panel-supervisor-chats.html` - Panel de supervisión
- ✅ `public/css/chat-agentes.css` - Estilos del sistema de chat

---

### 3. Código Backend Eliminado (server.js)

#### Funciones Eliminadas:
- ✅ `asignarConversacionAutomatica()` - Asignación round-robin
- ✅ `determinarCanal()` - Evaluación de reglas de enrutamiento
- ✅ Funciones de notificación SSE para agentes

#### Endpoints Eliminados:
- ✅ GET `/api/agentes/conversaciones`
- ✅ GET `/api/agentes/conversacion/:id/mensajes`
- ✅ POST `/api/agentes/conversacion/:id/mensaje`
- ✅ PUT `/api/agentes/estado`
- ✅ PUT `/api/agentes/conversacion/:id/transferir`
- ✅ PUT `/api/agentes/conversacion/:id/bot`
- ✅ PUT `/api/agentes/conversacion/:id/cerrar`
- ✅ GET `/api/admin/agentes`
- ✅ GET `/api/admin/estadisticas-chat`
- ✅ GET `/api/whatsapp/stream` - Server-Sent Events

#### Variables/Constantes Eliminadas:
- ✅ `PERMISOS_AGENTE_CHAT` - Lista de permisos de chat
- ✅ `sseClientesAgentes` - Mapa de conexiones SSE
- ✅ Referencias a roles `agente_chat` y `supervisor_chat` en validaciones

**Total de líneas eliminadas en server.js:** 869 líneas

---

### 4. Código Frontend Actualizado (public/js/auth.js)

- ✅ Eliminadas redirecciones a `/panel-agentes.html`
- ✅ Eliminadas redirecciones a `/panel-supervisor-chats.html`
- ✅ Removidas referencias a roles `agente_chat` y `supervisor_chat`

---

### 5. Documentación Eliminada

- ✅ `SISTEMA-CHAT-WHATSAPP.md` - Documentación completa del sistema (1445 líneas)

---

## Elementos Preservados

### Base de Datos:
- ✅ Tabla `conversaciones_whatsapp` simplificada con campos:
  - `id`, `celular`, `paciente_id`
  - `wix_chatbot_id`, `wix_whp_id`
  - `sincronizado_wix`, **`stopBot`**, `origen`
- ✅ Todos los registros de celulares mantenidos

### Índices Mantenidos:
- ✅ `idx_conv_celular` - Búsqueda por celular
- ✅ `idx_conv_stopbot` - Búsqueda por stopBot
- ✅ `idx_conv_wix_id` - Búsqueda por wix_whp_id

---

## Scripts Creados

1. **scripts/desmontar-sistema-chat.sql**
   - Script SQL ejecutado para eliminar tablas, columnas y roles
   - Ejecutado exitosamente el 2026-01-06

2. **scripts/limpiar-server-chat.js**
   - Script Node.js para eliminar código del sistema de chat en server.js
   - Ejecutado exitosamente el 2026-01-06

---

## Verificación Post-Desmonte

### ✅ Sistema funcional sin errores
- Base de datos limpia
- Server.js sin referencias a sistema de chat
- Frontend sin paneles de agentes
- Roles de chat eliminados del sistema

### ✅ Datos preservados
- Tabla `conversaciones_whatsapp` con `stopBot` y celulares intactos
- Sin pérdida de datos críticos

---

## Comandos Ejecutados

```bash
# 1. Ejecutar script SQL de desmonte
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/desmontar-sistema-chat.sql

# 2. Limpiar código en server.js
node scripts/limpiar-server-chat.js

# 3. Eliminar archivos frontend
rm -f public/panel-agentes.html public/panel-supervisor-chats.html public/css/chat-agentes.css SISTEMA-CHAT-WHATSAPP.md
```

---

## Notas Finales

- ✅ El campo `stopBot` sigue disponible para controlar el bot de Wix
- ✅ Todos los celulares almacenados se mantienen
- ✅ Sistema completamente desmontado sin residuos de código
- ✅ No se requiere rollback, cambios son permanentes

**Autor:** Claude Code
**Fecha:** 2026-01-06
