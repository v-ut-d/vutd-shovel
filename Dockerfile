FROM --platform=$BUILDPLATFORM node:16-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update -y&&apt-get install -y curl python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./package*.json ./
RUN sed '/prepare/d' -i package.json

RUN npm ci --ignore-scripts

COPY ./script ./script
RUN npm run compile-dict

COPY ./tsconfig.json ./prisma/schema.prisma ./
COPY ./src ./src
RUN npm run build



ARG TARGETARCH

COPY ./prisma ./prisma

RUN ARCH=$(echo $TARGETARCH|sed s/amd64/x64/)
RUN npm ci --target_arch=$ARCH




FROM node:16-bullseye-slim

WORKDIR /app
ENV NODE_ENV production

RUN apt-get update -y&&apt-get install -y openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


COPY ./prisma ./prisma
COPY ./package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dictionary ./dictionary
COPY --from=builder /app/node_modules ./node_modules


CMD ["npm", "start"]
