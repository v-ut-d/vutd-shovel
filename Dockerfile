FROM node:16-alpine AS builder

WORKDIR /app
COPY ./package*.json ./tsconfig.json ./prisma/schema.prisma ./

RUN npm i --ignore-scripts

COPY ./src ./src
RUN npm run build

FROM node:16-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/dist ./dist
COPY ./prisma ./prisma
COPY ./script ./script
COPY ./package*.json ./

RUN sed '/prepare/d' -i package.json

RUN apk add --no-cache --virtual .gyp python3 curl
RUN npm ci
RUN apk del .gyp


CMD ["npm", "start"]
