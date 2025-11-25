#!/bin/bash

echo "🔍 Sistema de Diagnóstico - Medical Appointment System"
echo "======================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 1. Verificando contenedores Docker..."
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "⚠️  Docker no disponible en este entorno"
echo ""

echo "📋 2. Verificando servicios de backend..."
echo "----------------------------------------"

# API Gateway
echo -n "API Gateway (port 4000): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌ No responde"
fi

# Appointment Service
echo -n "Appointment Service (port 3001): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌ No responde"
fi

# Patient Service
echo -n "Patient Service (port 3002): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌ No responde"
fi

# Notification Service
echo -n "Notification Service (port 3003): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌ No responde"
fi

# N8n
echo -n "N8n (port 5678): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null
if [ $? -eq 0 ]; then
    echo " ✅"
else
    echo " ❌ No responde"
fi

echo ""

echo "📋 3. Verificando base de datos..."
echo "----------------------------------------"
docker exec postgres psql -U appointment_user -d appointment_db -c "SELECT COUNT(*) as doctors FROM doctors;" 2>/dev/null || echo "⚠️  No se puede acceder a la base de datos"
echo ""

echo "📋 4. Probando endpoint /doctors desde N8n..."
echo "----------------------------------------"
echo "Intentando: http://api-gateway:3000/api/appointments/doctors"
curl -s http://localhost:4000/api/appointments/doctors 2>/dev/null | head -20
echo ""
echo ""

echo "📋 5. Verificando variables de entorno de N8n..."
echo "----------------------------------------"
docker exec n8n env | grep -E "N8N_|WEBHOOK" 2>/dev/null || echo "⚠️  No se puede acceder al contenedor de N8n"
echo ""

echo "📋 6. Últimos errores en logs..."
echo "----------------------------------------"

echo "▶ API Gateway:"
docker logs api-gateway --tail 10 2>/dev/null || echo "⚠️  No se pueden leer logs"
echo ""

echo "▶ Appointment Service:"
docker logs appointment-service --tail 10 2>/dev/null || echo "⚠️  No se pueden leer logs"
echo ""

echo "▶ N8n:"
docker logs n8n --tail 10 2>/dev/null || echo "⚠️  No se pueden leer logs"
echo ""

echo "📋 7. Verificando conectividad de red Docker..."
echo "----------------------------------------"
docker network inspect appointment-network 2>/dev/null | grep -A 5 "Containers" || echo "⚠️  Red no disponible"
echo ""

echo "✅ Diagnóstico completado"
echo ""
echo "📝 Recomendaciones:"
echo "1. Si algún servicio no responde, ejecuta: docker-compose restart <servicio>"
echo "2. Si la base de datos está vacía, ejecuta: docker-compose down -v && docker-compose up -d"
echo "3. Si N8n tiene errores, verifica: docker logs n8n -f"
