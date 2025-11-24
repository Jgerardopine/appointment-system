#!/bin/bash

# Script de verificación del sistema de citas médicas
# Verifica que todos los servicios estén funcionando correctamente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Sistema de Citas Médicas - Verificación de Estado       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar si un servicio está corriendo
check_service() {
    local service_name=$1
    local container_name=$2
    
    echo -n "Verificando $service_name... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${GREEN}✓ Corriendo${NC}"
        return 0
    else
        echo -e "${RED}✗ No está corriendo${NC}"
        return 1
    fi
}

# Función para verificar puerto
check_port() {
    local port=$1
    local service_name=$2
    
    echo -n "Verificando puerto $port ($service_name)... "
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ Accesible${NC}"
        return 0
    else
        echo -e "${RED}✗ No accesible${NC}"
        return 1
    fi
}

# Función para verificar endpoint HTTP
check_endpoint() {
    local url=$1
    local service_name=$2
    
    echo -n "Verificando endpoint $service_name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null || echo "000")
    
    if [ "$response" -ge 200 ] && [ "$response" -lt 500 ]; then
        echo -e "${GREEN}✓ HTTP $response${NC}"
        return 0
    else
        echo -e "${RED}✗ HTTP $response${NC}"
        return 1
    fi
}

# Verificar Docker
echo -e "\n${YELLOW}[1/6] Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker instalado${NC}"

# Verificar Docker Compose
echo -e "\n${YELLOW}[2/6] Verificando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose instalado${NC}"

# Verificar contenedores
echo -e "\n${YELLOW}[3/6] Verificando contenedores...${NC}"
services_ok=0
services_total=6

check_service "PostgreSQL" "postgres" && ((services_ok++))
check_service "API Gateway" "api-gateway" && ((services_ok++))
check_service "Appointment Service" "appointment-service" && ((services_ok++))
check_service "Patient Service" "patient-service" && ((services_ok++))
check_service "Notification Service" "notification-service" && ((services_ok++))
check_service "N8N" "n8n" && ((services_ok++))

echo ""
if [ $services_ok -eq $services_total ]; then
    echo -e "${GREEN}✓ Todos los servicios están corriendo ($services_ok/$services_total)${NC}"
else
    echo -e "${YELLOW}⚠ Algunos servicios no están corriendo ($services_ok/$services_total)${NC}"
fi

# Verificar puertos
echo -e "\n${YELLOW}[4/6] Verificando puertos...${NC}"
ports_ok=0
ports_total=6

check_port 5432 "PostgreSQL" && ((ports_ok++))
check_port 4000 "API Gateway" && ((ports_ok++))
check_port 3001 "Appointment Service" && ((ports_ok++))
check_port 3002 "Patient Service" && ((ports_ok++))
check_port 3003 "Notification Service" && ((ports_ok++))
check_port 5678 "N8N" && ((ports_ok++))

echo ""
if [ $ports_ok -eq $ports_total ]; then
    echo -e "${GREEN}✓ Todos los puertos son accesibles ($ports_ok/$ports_total)${NC}"
else
    echo -e "${YELLOW}⚠ Algunos puertos no son accesibles ($ports_ok/$ports_total)${NC}"
fi

# Verificar endpoints HTTP
echo -e "\n${YELLOW}[5/6] Verificando endpoints HTTP...${NC}"
endpoints_ok=0
endpoints_total=4

check_endpoint "http://localhost:4000/api/health" "API Gateway Health" && ((endpoints_ok++)) || true
check_endpoint "http://localhost:3001/health" "Appointment Service Health" && ((endpoints_ok++)) || true
check_endpoint "http://localhost:3002/health" "Patient Service Health" && ((endpoints_ok++)) || true
check_endpoint "http://localhost:5678" "N8N UI" && ((endpoints_ok++))

echo ""
if [ $endpoints_ok -eq $endpoints_total ]; then
    echo -e "${GREEN}✓ Todos los endpoints responden correctamente ($endpoints_ok/$endpoints_total)${NC}"
else
    echo -e "${YELLOW}⚠ Algunos endpoints no responden ($endpoints_ok/$endpoints_total)${NC}"
fi

# Verificar variables de entorno
echo -e "\n${YELLOW}[6/6] Verificando configuración...${NC}"

if [ -f .env ]; then
    echo -e "${GREEN}✓ Archivo .env existe${NC}"
    
    # Verificar token de Telegram
    if grep -q "TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here" .env || \
       grep -q "^TELEGRAM_BOT_TOKEN=$" .env; then
        echo -e "${YELLOW}⚠ Token de Telegram no configurado${NC}"
        echo -e "  ${BLUE}Edita el archivo .env y agrega tu token de Telegram${NC}"
    else
        echo -e "${GREEN}✓ Token de Telegram configurado${NC}"
    fi
    
    # Verificar configuración de base de datos
    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}✓ URL de base de datos configurada${NC}"
    else
        echo -e "${RED}✗ URL de base de datos no configurada${NC}"
    fi
else
    echo -e "${RED}✗ Archivo .env no existe${NC}"
    echo -e "  ${BLUE}Copia .env.example a .env: cp .env.example .env${NC}"
fi

# Verificar logs por errores
echo -e "\n${YELLOW}Revisando logs recientes...${NC}"
echo "Últimas líneas de los logs (busca errores):"
docker-compose logs --tail=5 2>/dev/null || echo "No se pudieron obtener logs"

# Resumen final
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     RESUMEN FINAL                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

total_checks=$((services_total + ports_total + endpoints_total))
total_ok=$((services_ok + ports_ok + endpoints_ok))
percentage=$((total_ok * 100 / total_checks))

echo ""
echo -e "Servicios corriendo: ${services_ok}/${services_total}"
echo -e "Puertos accesibles:  ${ports_ok}/${ports_total}"
echo -e "Endpoints activos:   ${endpoints_ok}/${endpoints_total}"
echo -e "────────────────────────────────"
echo -e "Total:              ${total_ok}/${total_checks} (${percentage}%)"
echo ""

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}✓ Sistema completamente operativo${NC}"
    echo -e "\n${BLUE}Próximos pasos:${NC}"
    echo "1. Accede a N8N: http://localhost:5678"
    echo "2. Importa el workflow desde: n8n/workflows/telegram-bot-complete.json"
    echo "3. Configura las credenciales de Telegram"
    echo "4. Activa el workflow"
    echo "5. Prueba tu bot en Telegram"
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠ Sistema mayormente operativo pero con algunos problemas${NC}"
    echo -e "\n${BLUE}Acciones recomendadas:${NC}"
    echo "1. Revisa los servicios que no están corriendo"
    echo "2. Verifica los logs: docker-compose logs -f [servicio]"
    echo "3. Reinicia los servicios problemáticos: docker-compose restart [servicio]"
elif [ $percentage -ge 50 ]; then
    echo -e "${YELLOW}⚠ Sistema parcialmente operativo - varios problemas detectados${NC}"
    echo -e "\n${BLUE}Acciones recomendadas:${NC}"
    echo "1. Reinicia todos los servicios: docker-compose restart"
    echo "2. Verifica la configuración en .env"
    echo "3. Revisa los logs: docker-compose logs -f"
else
    echo -e "${RED}✗ Sistema no operativo - múltiples problemas críticos${NC}"
    echo -e "\n${BLUE}Acciones recomendadas:${NC}"
    echo "1. Detén todos los servicios: docker-compose down"
    echo "2. Verifica el archivo .env existe y está configurado"
    echo "3. Inicia los servicios: docker-compose up -d"
    echo "4. Ejecuta este script nuevamente"
fi

echo ""
echo -e "${BLUE}Documentación:${NC}"
echo "- Guía completa: docs/N8N_TELEGRAM_SETUP.md"
echo "- Inicio rápido: QUICK_START.md"
echo "- README: README.md"
echo ""
