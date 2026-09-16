#!/bin/sh
set -e

mkdir -p /etc/nginx/certs /var/www/acme/.well-known/acme-challenge

if [ ! -s /etc/nginx/certs/fullchain.pem ] || [ ! -s /etc/nginx/certs/privkey.pem ]; then
  echo "Generating temporary self-signed TLS certificate"
  openssl req -x509 -nodes -newkey rsa:2048 -days 7 \
    -keyout /etc/nginx/certs/privkey.pem \
    -out /etc/nginx/certs/fullchain.pem \
    -subj "/CN=${PUBLIC_IP:-localhost}"
fi

reload_on_cert_change() {
  while true; do
    inotifywait -e close_write,moved_to,create /etc/nginx/certs || sleep 5
    nginx -s reload || true
  done
}

reload_on_cert_change &

exec /docker-entrypoint.sh nginx -g 'daemon off;'
