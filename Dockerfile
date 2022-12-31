# Please use `docker buildx build` instead of normal `docker build` to build this Dockerfile.
# e.g. `docker buildx build --platform=linux/arm64,linux/amd64 .`

FROM --platform=$BUILDPLATFORM node:18-bullseye-slim AS base

WORKDIR /app

RUN apt-get update -y&&apt-get install -y curl python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./package*.json ./
RUN sed '/prepare/d' -i package.json

RUN npm ci --ignore-scripts

FROM base AS builder

COPY ./tsconfig.json ./prisma/schema.prisma ./
COPY ./src ./src
RUN npm run build


FROM base AS modules
ARG TARGETARCH

COPY ./prisma/schema.prisma ./
RUN npm ci --target_arch=$(echo "$TARGETARCH"|sed s/amd64/x64/)



FROM base AS dict
RUN npm --prefix node_modules/node-openjtalk-binding/ run install
COPY ./script ./script
RUN npm run compile-dict



FROM node:18-bullseye-slim

WORKDIR /app
ENV NODE_ENV production

RUN apt-get update -y&&apt-get install -y openssl ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./prisma ./prisma
COPY ./package*.json ./
COPY --from=modules /app/node_modules ./node_modules
COPY --from=dict /app/dictionary ./dictionary
COPY --from=builder /app/dist ./dist

CMD ["npm", "start"]
