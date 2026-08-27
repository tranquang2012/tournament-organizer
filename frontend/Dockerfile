FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl inotify-tools \
  && mkdir -p /etc/nginx/snippets

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-app.conf /etc/nginx/snippets/app.conf
COPY docker-entrypoint.sh /docker-app-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-app-entrypoint.sh

EXPOSE 80 443
ENTRYPOINT ["/docker-app-entrypoint.sh"]
