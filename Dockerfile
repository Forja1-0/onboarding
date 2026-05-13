# Stage 1: Construcción (Build)
FROM node:20-alpine AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Compilar la aplicación para producción
RUN npm run build

# Stage 2: Servidor (Nginx)
FROM nginx:alpine

# Copiar los archivos compilados ('dist' por defecto en Vite) al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Opcional: si tienes un archivo de configuración de nginx personalizado
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
