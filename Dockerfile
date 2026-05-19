# Etapa 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json .npmrc ./
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .
RUN npm run build

# Etapa 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Copiar solo lo necesario del build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --legacy-peer-deps --omit=dev

EXPOSE 4321

ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "./dist/server/entry.mjs"]
