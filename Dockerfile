# Stage 1: Construcción (Build)
FROM public.ecr.aws/docker/library/node:20-alpine AS build

WORKDIR /app

# Vite inlinea import.meta.env.VITE_* en build time. Necesitamos que
# EasyPanel (o quien buildee) pase --build-arg VITE_API_URL=... y que ese
# valor esté en el entorno cuando se corre `npm run build`.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .

RUN echo "Building with VITE_API_URL=${VITE_API_URL}" && npm run build

# Stage 2: Servidor (Nginx)
FROM public.ecr.aws/docker/library/nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback: cualquier ruta desconocida sirve index.html para que
# react-router maneje el routing client-side.
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
