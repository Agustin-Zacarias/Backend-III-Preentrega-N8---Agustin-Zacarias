# Imagen oficial de Node.js LTS sobre Alpine para reducir el tamaño de la imagen.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    UPLOADS_DIR=/app/uploads

WORKDIR /app

# Instala solo dependencias de producción mediante el lockfile.
COPY package*.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copia únicamente el código de ejecución (tests, secretos y uploads están en .dockerignore).
COPY --chown=node:node src ./src
RUN mkdir -p /app/uploads /app/logs \
    && chown -R node:node /app

USER node

EXPOSE 3000
VOLUME ["/app/uploads", "/app/logs"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
