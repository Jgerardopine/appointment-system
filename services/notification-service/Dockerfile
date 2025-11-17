# Etapa 1: build de dependencias (opcional pero bueno para producción)
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json si lo tienes (ver siguiente sección)
COPY package*.json ./

# Instalar dependencias en modo production
RUN npm install --omit=dev

# Etapa 2: imagen final
FROM node:18-alpine

WORKDIR /app

# Copiar dependencias ya instaladas desde la etapa builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar el código del servicio
COPY . .

# Variables de entorno por defecto (se sobreescriben en docker-compose)
ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

# Comando de arranque
CMD ["node", "index.js"]