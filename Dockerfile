# Multi-stage build tanpa curl
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p dist && \
    cp index.html dist/ && \
    [ -f style.css ] && cp style.css dist/ || true && \
    [ -f script.js ] && cp script.js dist/ || true

FROM nginx:alpine

# Copy files tanpa health check (tanpa curl)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
