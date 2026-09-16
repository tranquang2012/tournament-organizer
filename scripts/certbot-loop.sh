#!/bin/sh
set -eu

IP="${PUBLIC_IP:-}"
EMAIL="${CERTBOT_EMAIL:-}"

if [ -z "$IP" ]; then
  echo "PUBLIC_IP is not set; skipping Let's Encrypt"
  while true; do sleep 86400; done
fi

echo "Waiting for nginx on port 80"
i=0
while [ "$i" -lt 30 ]; do
  if wget -qO- "http://frontend/.well-known/acme-challenge/" >/dev/null 2>&1 \
    || wget -qO- "http://frontend/" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

email_args="--register-unsafely-without-email"
if [ -n "$EMAIL" ]; then
  email_args="--email $EMAIL"
fi

request_cert() {
  certbot certonly \
    --webroot -w /var/www/acme \
    --preferred-profile shortlived \
    --ip-address "$IP" \
    --cert-name "$IP" \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring \
    $email_args
}

install_cert() {
  live="/etc/letsencrypt/live/$IP"
  if [ -s "$live/fullchain.pem" ] && [ -s "$live/privkey.pem" ]; then
    cp "$live/fullchain.pem" /etc/nginx/certs/fullchain.pem
    cp "$live/privkey.pem" /etc/nginx/certs/privkey.pem
    echo "Installed Let's Encrypt certificate for $IP"
  fi
}

if request_cert; then
  install_cert
else
  echo "Let's Encrypt issuance failed; keeping existing certificate"
fi

while true; do
  sleep 43200
  if certbot renew --non-interactive; then
    install_cert
  fi
done
