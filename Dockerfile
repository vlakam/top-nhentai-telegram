FROM node:12-alpine AS builder

ENV NODE_WORKDIR /app
WORKDIR $NODE_WORKDIR

ADD . $NODE_WORKDIR

RUN rm -rf dist
RUN npm install
RUN npm run build

FROM node:12-alpine

ENV NODE_WORKDIR /app
WORKDIR $NODE_WORKDIR

COPY --from=builder $NODE_WORKDIR/dist ./dist
COPY package* ./
RUN npm install --production

CMD npm start