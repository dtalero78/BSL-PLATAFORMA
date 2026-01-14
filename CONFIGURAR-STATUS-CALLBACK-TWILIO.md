# Configurar Status Callback en Twilio WhatsApp

Este documento explica cómo configurar Twilio para que notifique a nuestra aplicación cuando se envíen mensajes desde plataformas externas (como Wix, scripts, o cualquier otra integración).

## ¿Qué es el Status Callback?

El Status Callback es un webhook que Twilio llama cada vez que el estado de un mensaje cambia (enviado, entregado, leído, fallido, etc.). Esto nos permite capturar mensajes enviados desde cualquier plataforma, no solo desde nuestro panel de administración.

## ¿Por qué lo necesitamos?

**Problema**: Cuando enviamos mensajes usando templates desde Wix o desde scripts externos que llaman directamente a la API de Twilio, esos mensajes NO aparecen en nuestro panel de WhatsApp porque no pasan por nuestro sistema.

**Solución**: Configurar el Status Callback para que Twilio nos notifique de TODOS los mensajes enviados, sin importar desde dónde.

## Cambios realizados en el código

### 1. Nuevo endpoint: `/api/whatsapp/status`

Ubicación: `server.js:3117-3261`

Este endpoint:
- Recibe notificaciones de Twilio cuando un mensaje es enviado
- Verifica si el mensaje ya existe en nuestra BD (evita duplicados)
- Si NO existe, lo registra como mensaje saliente
- Emite evento WebSocket para actualizar el panel en tiempo real

### 2. StatusCallback agregado a funciones de envío

Se agregó `statusCallback` a:
- `sendWhatsAppMessage()` - Para templates (línea 379)
- `sendWhatsAppFreeText()` - Para texto libre (línea 421)

### 3. Variable de entorno agregada

`.env`:
```
BASE_URL=https://bsl-plataforma.com
```

## Configuración en Twilio Console

Ahora debes configurar Twilio para que use este callback. Hay **dos formas** de hacerlo:

### Opción 1: Configuración Global (Recomendada)

Esta opción aplica a TODOS los mensajes enviados desde cualquier lugar.

1. Ve a [Twilio Console - WhatsApp Senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders)

2. Busca tu número de WhatsApp: `+573153369631`

3. Haz clic en el número para ver la configuración

4. Busca la sección **"Status Callback URL"**

5. Ingresa la URL:
   ```
   https://bsl-plataforma.com/api/whatsapp/status
   ```

6. Selecciona los eventos que quieres recibir:
   - ✅ Sent (Enviado)
   - ✅ Delivered (Entregado)
   - ⬜ Read (Leído) - Opcional
   - ⬜ Failed (Fallido) - Opcional

7. Guarda los cambios

### Opción 2: Por Messaging Service

Si usas un Messaging Service, configúralo allí:

1. Ve a [Messaging Services](https://console.twilio.com/us1/develop/sms/services)

2. Selecciona tu servicio: `MGc1f5b95b3e7e9f9fc29065c217cbead7`

3. Ve a **"Integration"** o **"Status Callbacks"**

4. Ingresa la misma URL:
   ```
   https://bsl-plataforma.com/api/whatsapp/status
   ```

5. Guarda los cambios

## Verificar que funciona

### Prueba 1: Desde el panel de administración

1. Abre el panel de WhatsApp en tu aplicación
2. Envía un mensaje a cualquier contacto
3. El mensaje debe aparecer inmediatamente en el chat
4. En los logs del servidor deberías ver:
   ```
   📝 Mensaje a enviar (raw): "..."
   📱 WhatsApp texto libre enviado a ...
   📊 Status callback de Twilio: { sid: 'SM...', status: 'sent', ... }
   ✅ Mensaje ya registrado: SM...
   ```

### Prueba 2: Desde plataforma externa (Wix)

1. Envía un mensaje usando un template desde Wix o un script externo
2. El mensaje debe aparecer en el panel de WhatsApp
3. En los logs del servidor deberías ver:
   ```
   📊 Status callback de Twilio: { sid: 'SM...', status: 'sent', ... }
   📝 Registrando mensaje enviado desde plataforma externa
   ✅ Mensaje externo guardado en conversación: 123
   ```

### Prueba 3: WebSocket en tiempo real

1. Abre el panel de WhatsApp en dos navegadores diferentes
2. Envía un mensaje desde Wix
3. El mensaje debe aparecer en AMBOS navegadores automáticamente

## Actualizar scripts externos (Wix)

Para que los mensajes enviados desde Wix también incluyan el statusCallback, actualiza tus funciones en `WIX/http-functions.js`:

```javascript
// ANTES
const message = await twilioClient.messages.create({
    contentSid: 'HX...',
    from: 'whatsapp:+573153369631',
    to: `whatsapp:${numero}`
});

// DESPUÉS
const message = await twilioClient.messages.create({
    contentSid: 'HX...',
    from: 'whatsapp:+573153369631',
    to: `whatsapp:${numero}`,
    statusCallback: 'https://bsl-plataforma.com/api/whatsapp/status'
});
```

**Nota**: Si configuras el Status Callback globalmente en Twilio Console (Opción 1), NO necesitas modificar los scripts de Wix. La configuración global aplicará automáticamente.

## Flujo completo

```mermaid
graph TD
    A[Script Wix envía mensaje] --> B[Twilio API]
    B --> C[Mensaje enviado al cliente]
    B --> D[Twilio llama statusCallback]
    D --> E[/api/whatsapp/status]
    E --> F{¿Mensaje existe en BD?}
    F -->|Sí| G[Ignorar - ya registrado]
    F -->|No| H[Guardar en BD]
    H --> I[Emitir evento WebSocket]
    I --> J[Panel de WhatsApp se actualiza]
```

## Troubleshooting

### El mensaje no aparece en el panel

1. **Verifica los logs del servidor**:
   ```bash
   tail -f server.log | grep "Status callback"
   ```

2. **Verifica que el callback esté configurado en Twilio**:
   - Ve a Twilio Console → WhatsApp Sender
   - Confirma que la URL esté configurada
   - Confirma que incluya "Sent" y "Delivered"

3. **Verifica que la URL sea accesible públicamente**:
   ```bash
   curl https://bsl-plataforma.com/api/whatsapp/status
   ```
   Debería devolver un error 405 (Method Not Allowed) o similar, pero NO 404.

4. **Verifica en Twilio Debugger**:
   - Ve a [Twilio Debugger](https://console.twilio.com/us1/monitor/logs/debugger)
   - Busca errores relacionados con el callback

### El mensaje aparece duplicado

Esto podría pasar si:
- El mensaje se registra tanto desde el envío directo como desde el callback
- La verificación de `sid_twilio` no está funcionando

Solución: El código ya incluye esta validación en línea 3136-3145 de server.js

### El servidor no recibe el callback

1. **Verifica firewall**: Asegúrate de que el puerto 8080 o tu proxy (nginx) esté abierto
2. **Verifica HTTPS**: Twilio requiere HTTPS para callbacks en producción
3. **Verifica que BASE_URL esté correctamente configurado** en `.env`

## Resumen

✅ Nuevo endpoint `/api/whatsapp/status` implementado
✅ StatusCallback agregado a funciones de envío
✅ Variable `BASE_URL` agregada a `.env`
⏳ **PENDIENTE**: Configurar Status Callback en Twilio Console (seguir Opción 1 o 2)

Una vez configurado en Twilio, TODOS los mensajes (enviados desde cualquier plataforma) aparecerán automáticamente en el panel de WhatsApp.
