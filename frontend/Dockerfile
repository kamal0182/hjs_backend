# --- deps: install dependencies once, reused by dev and build stages ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- development: Vite dev server with hot reload ---
# /api is proxied to the backend via VITE_API_PROXY_TARGET (see vite.config.ts).
FROM deps AS development
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- build: compile static assets for production ---
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# --- production: serve the built assets with nginx, proxy /api to Django ---
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/ /etc/nginx/snippets/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
