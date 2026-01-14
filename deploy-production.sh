#!/bin/bash

# Script de deployment para servidor de producción
# Ejecutar este script en el servidor de producción para actualizar el código

set -e  # Detener si hay algún error

echo "🚀 Iniciando deployment de BSL-PLATAFORMA..."
echo ""

# 1. Ir al directorio del proyecto
cd /root/BSL-PLATAFORMA || {
    echo "❌ Error: No se pudo acceder al directorio /root/BSL-PLATAFORMA"
    echo "   Ajusta la ruta en este script según tu configuración"
    exit 1
}

echo "📂 Directorio actual: $(pwd)"
echo ""

# 2. Guardar cambios locales si existen (stash)
echo "💾 Guardando cambios locales temporalmente..."
git stash
echo ""

# 3. Hacer pull de los cambios
echo "📥 Descargando últimos cambios del repositorio..."
git pull origin main
echo ""

# 4. Verificar que .env tiene BASE_URL
echo "🔍 Verificando configuración de .env..."
if grep -q "^BASE_URL=" .env; then
    echo "✅ BASE_URL está configurado en .env"
    grep "^BASE_URL=" .env
else
    echo "⚠️  BASE_URL no encontrado en .env, agregándolo..."
    echo "" >> .env
    echo "# Base URL (para callbacks de Twilio)" >> .env
    echo "BASE_URL=https://bsl-plataforma.com" >> .env
    echo "✅ BASE_URL agregado a .env"
fi
echo ""

# 5. Instalar dependencias si hay cambios en package.json
echo "📦 Verificando dependencias..."
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    echo "📦 Instalando nuevas dependencias..."
    npm install
else
    echo "✅ No hay cambios en dependencias"
fi
echo ""

# 6. Reiniciar el servidor
echo "🔄 Reiniciando servidor Node.js..."

# Intentar con PM2 primero
if command -v pm2 &> /dev/null; then
    echo "   Usando PM2..."
    pm2 list
    echo ""
    echo "   Reiniciando con PM2..."
    pm2 restart all || pm2 restart bsl-plataforma
    echo ""
    echo "📊 Estado de PM2:"
    pm2 list
    echo ""
    echo "📋 Últimas 30 líneas de logs:"
    pm2 logs --lines 30 --nostream
elif systemctl list-units --type=service | grep -q "bsl"; then
    echo "   Usando systemd..."
    SERVICE_NAME=$(systemctl list-units --type=service | grep bsl | awk '{print $1}' | head -1)
    sudo systemctl restart "$SERVICE_NAME"
    echo "✅ Servicio reiniciado: $SERVICE_NAME"
    echo ""
    echo "📊 Estado del servicio:"
    sudo systemctl status "$SERVICE_NAME" --no-pager
else
    echo "⚠️  No se detectó PM2 ni systemd"
    echo "   Necesitas reiniciar el servidor manualmente:"
    echo "   - Si usas PM2: pm2 restart all"
    echo "   - Si usas systemd: systemctl restart bsl-plataforma"
    echo "   - Si usas nohup: pkill -f 'node server.js' && nohup node server.js > server.log 2>&1 &"
fi
echo ""

# 7. Verificar que el endpoint está respondiendo
echo "🧪 Verificando que el servidor está funcionando..."
sleep 3

# Test local del endpoint
echo "   Probando endpoint de status callback localmente..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/whatsapp/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=TEST&MessageStatus=sent&To=whatsapp:+573125727007&From=whatsapp:+573153369631&Body=Test&NumMedia=0" 2>&1)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Endpoint /api/whatsapp/status responde correctamente (HTTP $RESPONSE)"
else
    echo "⚠️  Endpoint responde con código: $RESPONSE"
    echo "   Esto puede ser normal si el mensaje no se guardó (duplicado o error esperado)"
fi
echo ""

# 8. Test desde internet
echo "   Probando endpoint desde internet..."
RESPONSE_EXT=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://bsl-plataforma.com/api/whatsapp/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=TEST&MessageStatus=sent&To=whatsapp:+573125727007&From=whatsapp:+573153369631&Body=Test&NumMedia=0" 2>&1)

if [ "$RESPONSE_EXT" = "200" ]; then
    echo "✅ Endpoint público responde correctamente (HTTP $RESPONSE_EXT)"
else
    echo "❌ Endpoint público no responde correctamente (HTTP $RESPONSE_EXT)"
    echo "   Verifica la configuración de Nginx"
fi
echo ""

echo "✅ Deployment completado!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica los logs del servidor:"
echo "      pm2 logs --lines 50"
echo "      # O si usas systemd:"
echo "      journalctl -u bsl-plataforma -n 50 -f"
echo ""
echo "   2. Prueba el flujo completo desde tu computadora local:"
echo "      node test-status-callback.js"
echo ""
echo "   3. Verifica en Twilio Debugger si hay errores:"
echo "      https://console.twilio.com/us1/monitor/logs/debugger"
echo ""
