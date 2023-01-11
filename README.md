ter# visualizer

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Run your unit tests
```
yarn test:unit
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

docker run --rm --name temp_certbot \
-v "/home/hello/certbot/letsencrypt:/etc/letsencrypt" \
-v "/home/hello/certbot/www:/tmp/letsencrypt" \
certbot/certbot:v1.8.0 \
certonly --webroot --agree-tos --renew-by-default \
--preferred-challenges http-01 --server https://acme-v02.api.letsencrypt.org/directory \
--text --email hello@denzyl.io \
-w /tmp/letsencrypt -d denzyl.io 