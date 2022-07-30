# Please use `docker buildx build` instead of normal `docker build` to build this Dockerfile.
# e.g. `docker buildx build --platform=linux/arm64,linux/amd64 .`

FROM --platform=$BUILDPLATFORM node:16-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update -y&&apt-get install -y curl python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./package*.json ./
RUN sed '/prepare/d' -i package.json

RUN npm ci --ignore-scripts

COPY ./tsconfig.json ./prisma/schema.prisma ./
COPY ./src ./src
RUN npm run build



FROM builder AS modules
ARG TARGETARCH
RUN npm ci --target_arch=$(echo "$TARGETARCH"|sed s/amd64/x64/)



FROM builder AS dict
RUN npm --prefix node_modules/node-openjtalk-binding/ run install
COPY ./script ./script
RUN npm run compile-dict



FROM node:16-bullseye-slim

WORKDIR /app
ENV NODE_ENV production

RUN apt-get update -y&&apt-get install -y openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./prisma ./prisma
COPY ./package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=dict /app/dictionary ./dictionary
COPY --from=modules /app/node_modules ./node_modules

CMD ["npm", "start"]
