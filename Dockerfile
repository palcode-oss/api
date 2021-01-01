FROM node:14-slim

ENV PORT=80
ENV NODE_ENV=production

RUN mkdir /opt/palcode-api
WORKDIR /opt/palcode-api

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --production
COPY . ./

CMD [ "yarn", "run", "start" ]
