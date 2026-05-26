# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# TMDB API key injected at build time
ARG VITE_TMDB_API_KEY
ARG VITE_TMDB_BASE_URL
ARG VITE_TMDB_IMAGE_URL

ENV VITE_TMDB_API_KEY=$VITE_TMDB_API_KEY
ENV VITE_TMDB_BASE_URL=$VITE_TMDB_BASE_URL
ENV VITE_TMDB_IMAGE_URL=$VITE_TMDB_IMAGE_URL

RUN npm run build

# Stage 2 — Serve
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Handle React Router client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]