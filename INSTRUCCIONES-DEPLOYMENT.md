# Instrucciones para Deployment en Producción

## Situación Actual

El código con el Status Callback ya está en el repositorio (commit `29e1656`), pero **el servidor de producción NO tiene estos cambios**.

Por eso el test falla con:
```
✅ Mensaje enviado exitosamente!
   - Status Callback URL: No configurado  ❌
```

## Opción 1: Deployment Automático (Recomendado)

Copia el script `deploy-production.sh` al servidor y ejecútalo:

```bash
# Desde tu computadora local
scp deploy-production.sh root@bsl-plataforma.com:/root/

# Conectarse al servidor
ssh root@bsl-plataforma.com

# Ejecutar el script
cd /root
chmod +x deploy-production.sh
./deploy-production.sh
```

El script hará todo automáticamente:
- Pull de los cambios
- Verificar .env
- Reiniciar el servidor
- Probar el endpoint

## Opción 2: Deployment Manual

Si prefieres hacerlo paso a paso:

### 1. Conectarse al servidor

```bash
ssh root@bsl-plataforma.com
```

### 2. Ir al directorio del proyecto

```bash
cd /root/BSL-PLATAFORMA
# Ajusta la ruta según tu configuración
```

### 3. Hacer pull de los cambios

```bash
git pull origin main
```

Deberías ver:
```
Updating 80ddb12..29e1656
Fast-forward
 public/twilio-chat.html | 150 +++++++++++++++++++++
 server.js              |  62 ++++++++--
 2 files changed, 205 insertions(+), 7 deletions(-)
```

### 4. Verificar .env

```bash
grep BASE_URL .env
```

Debe mostrar:
```
BASE_URL=https://bsl-plataforma.com
```

Si no aparece, agrégalo:
```bash
echo "" >> .env
echo "# Base URL (para callbacks de Twilio)" >> .env
echo "BASE_URL=https://bsl-plataforma.com" >> .env
```

### 5. Reiniciar el servidor

**Con PM2:**
```bash
pm2 restart all
# O especificar el nombre:
pm2 restart bsl-plataforma

# Ver logs:
pm2 logs --lines 50
```

**Con systemd:**
```bash
systemctl restart bsl-plataforma
# Ver status:
systemctl status bsl-plataforma
```

**Con nohup:**
```bash
# Matar proceso actual
pkill -f "node server.js"

# Iniciar de nuevo
nohup node server.js > server.log 2>&1 &

# Ver logs:
tail -50 server.log
```

### 6. Verificar endpoint localmente

```bash
curl -X POST http://localhost:8080/api/whatsapp/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=TEST&MessageStatus=sent&To=whatsapp:+573125727007&From=whatsapp:+573153369631&Body=Test&NumMedia=0"
```

Debería responder con HTTP 200.

### 7. Verificar endpoint públicamente

```bash
curl -X POST https://bsl-plataforma.com/api/whatsapp/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=TEST&MessageStatus=sent&To=whatsapp:+573125727007&From=whatsapp:+573153369631&Body=Test&NumMedia=0"
```

Debería responder con HTTP 200. Si no, hay un problema con Nginx.

### 8. Ver logs del servidor

```bash
# Con PM2:
pm2 logs --lines 50

# Con systemd:
journalctl -u bsl-plataforma -n 50 -f

# Con nohup:
tail -50 server.log
```

Busca líneas como:
```
📊 Status callback de Twilio: { sid: 'TEST', status: 'sent', ... }
```

## Opción 3: Verificar qué proceso de Node.js está corriendo

Si no estás seguro de cómo está corriendo el servidor:

```bash
# Ver todos los procesos de Node.js
ps aux | grep node

# Ver si PM2 está corriendo
pm2 list

# Ver servicios de systemd
systemctl list-units --type=service | grep bsl

# Ver puerto 8080
netstat -tulpn | grep 8080
# O:
lsof -i :8080
```

## Verificación Final

Una vez actualizado el servidor, desde tu computadora local ejecuta:

```bash
node test-status-callback.js
```

Ahora DEBE mostrar:
```
✅ Mensaje enviado exitosamente!
   - Status Callback URL: https://bsl-plataforma.com/api/whatsapp/status  ✅

⏳ Esperando callback de Twilio (10 segundos)...

✅ ¡SUCCESS! El mensaje fue guardado automáticamente por el Status Callback!
```

## Troubleshooting

### El endpoint responde 404 o "Cannot POST"

**Problema**: El servidor Node.js no tiene el código actualizado.

**Solución**: Vuelve al paso 3 (git pull) y asegúrate de reiniciar el servidor.

### El endpoint responde localmente pero no públicamente

**Problema**: Nginx no está proxy-eando correctamente.

**Solución**: Verificar configuración de Nginx:

```bash
# Ver configuración de Nginx
cat /etc/nginx/sites-enabled/bsl-plataforma
# O:
cat /etc/nginx/nginx.conf

# Buscar el bloque de proxy para /api/
grep -A10 "location /api" /etc/nginx/sites-enabled/*
```

Debe tener algo como:
```nginx
location /api/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Si falta o está mal, edita el archivo y recarga Nginx:
```bash
nginx -t  # Verificar sintaxis
systemctl reload nginx
```

### El servidor no reinicia con PM2

```bash
# Ver estado
pm2 list

# Ver logs de error
pm2 logs --err --lines 50

# Si falla, intentar:
pm2 delete all
pm2 start server.js --name bsl-plataforma
```

## Información del Sistema

- **Repositorio**: https://github.com/dtalero78/BSL-PLATAFORMA.git
- **Commit actual en producción**: Probablemente `80ddb12` o anterior
- **Commit requerido**: `29e1656` (Feature: WhatsApp Business templates, Status Callback y media proxy)
- **Archivo principal**: server.js
- **Puerto**: 8080 (interno), 443 (público via Nginx)
- **Endpoint nuevo**: `/api/whatsapp/status` (POST)

## Contacto

Si tienes problemas con el deployment, revisa:
1. Los logs del servidor Node.js
2. Los logs de Nginx: `/var/log/nginx/error.log` y `/var/log/nginx/access.log`
3. El Twilio Debugger: https://console.twilio.com/us1/monitor/logs/debugger
