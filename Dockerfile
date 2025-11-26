# Single stage - langsung copy ke nginx
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/ 2>/dev/null || true
COPY script.js /usr/share/nginx/html/ 2>/dev/null || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
