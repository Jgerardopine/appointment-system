#!/bin/bash

echo "🔍 Probando Endpoints del Sistema"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para probar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        echo "Response: $body" | head -c 200
        echo ""
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "Response: $body"
        echo ""
    fi
    echo ""
}

echo "1️⃣ Probando Health Endpoints"
echo "-----------------------------"
test_endpoint "API Gateway Health" "http://localhost:4000/health"
test_endpoint "Appointment Service Health" "http://localhost:3001/health"
test_endpoint "Patient Service Health" "http://localhost:3002/health"
test_endpoint "Notification Service Health" "http://localhost:3003/health"

echo ""
echo "2️⃣ Probando Appointment Service Endpoints"
echo "-------------------------------------------"
test_endpoint "List Doctors (Direct)" "http://localhost:3001/doctors"
test_endpoint "List Doctors (via Gateway)" "http://localhost:4000/api/appointments/doctors"

echo ""
echo "3️⃣ Verificando Base de Datos"
echo "-----------------------------"
docker-compose exec -T postgres psql -U appointment_user -d appointment_db -c "SELECT COUNT(*) as total_doctors FROM doctors;" 2>/dev/null || echo "❌ No se puede conectar a PostgreSQL"

echo ""
echo "4️⃣ Logs Recientes del Appointment Service"
echo "-------------------------------------------"
docker logs appointment-service --tail 20 2>/dev/null || echo "❌ No se pueden leer logs"

echo ""
echo "✅ Diagnóstico completado"
