FROM node:alpine

WORKDIR /usr/src/bot
COPY . .

RUN apk add --update \
	&& apk add --no-cache ffmpeg \
	&& apk add --no-cache --virtual .build-deps git python g++ make \
	&& npm i \
	&& npm run build \
	&& apk del .build-deps

CMD ["node", "bin/index.js"]
