# Sistema de Gestión de Citas Médicas con Microservicios

## 🏗️ Arquitectura del Sistema

Este proyecto demuestra la implementación de microservicios aplicando principios SOLID y patrones de diseño, integrado con N8N y Telegram para crear un agente conversacional de gestión de citas.

### Componentes Principales

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│    Telegram      │────▶│      N8N        │────▶│   API Gateway    │
│     Bot          │◀────│   (Orquestador)  │◀────│                  │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                            │
                    ┌───────────────────────────────────────┼───────────────────────────────────────┐
                    │                                       │                                       │
            ┌───────▼──────────┐                 ┌─────────▼──────────┐                 ┌──────────▼─────────┐
            │                  │                 │                    │                 │                    │
            │  Appointment     │                 │    Patient         │                 │   Notification     │
            │   Service        │                 │    Service         │                 │    Service         │
            │                  │                 │                    │                 │                    │
            └──────────────────┘                 └────────────────────┘                 └────────────────────┘
                    │                                       │                                       │
                    └───────────────────────────────────────┼───────────────────────────────────────┘
                                                            │
                                                    ┌───────▼──────────┐
                                                    │                  │
                                                    │   PostgreSQL     │
                                                    │    Database      │
                                                    │                  │
                                                    └──────────────────┘
```

## 🎯 Principios SOLID Aplicados

### 1. **S**ingle Responsibility Principle (SRP)
- Cada microservicio tiene una única responsabilidad
- Las clases dentro de cada servicio tienen propósitos específicos

### 2. **O**pen/Closed Principle (OCP)
- Los servicios están abiertos a extensión pero cerrados a modificación
- Uso de interfaces y clases abstractas

### 3. **L**iskov Substitution Principle (LSP)
- Las implementaciones concretas pueden sustituir a sus abstracciones
- Los repositorios implementan interfaces comunes

### 4. **I**nterface Segregation Principle (ISP)
- Interfaces específicas para cada contexto
- No se fuerza a las clases a implementar métodos innecesarios

### 5. **D**ependency Inversion Principle (DIP)
- Dependencia de abstracciones, no de concreciones
- Inyección de dependencias en todos los servicios

## 🚀 Características del Sistema

- **Gestión de Citas**: Crear, verificar, actualizar y cancelar citas médicas
- **Gestión de Pacientes**: Registro y administración de pacientes
- **Notificaciones**: Envío de recordatorios y confirmaciones
- **Integración con Telegram**: Bot conversacional para interacción natural
- **Orquestación con N8N**: Flujos automatizados de trabajo
- **Base de Datos PostgreSQL**: Persistencia de datos confiable
- **Docker y Docker Compose**: Contenedorización completa

## 📋 Prerrequisitos

- Docker Desktop instalado
- Node.js 18+ (para desarrollo local)
- Git
- Visual Studio Code
- Cuenta de Telegram
- Token de Bot de Telegram (obtenido de @BotFather)

## 🛠️ Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/appointment-system.git
cd appointment-system

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tu token de Telegram
# TELEGRAM_BOT_TOKEN=tu_token_aquí

# Iniciar todos los servicios
docker-compose up -d

# Verificar que todos los servicios estén corriendo
docker-compose ps
```

## 📚 Documentación

- [Guía de Instalación Detallada](./docs/INSTALLATION.md)
- [Documento de Diseño](./docs/DESIGN.md)
- [Guía de la API](./docs/API.md)
- [Manual de N8N](./docs/N8N_SETUP.md)
