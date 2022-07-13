FROM node:16-bullseye-slim AS base
RUN apt-get update -y&&apt-get install -y openssl\
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


FROM base AS builder

WORKDIR /app

RUN apt-get update -y&&apt-get install -y curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./package*.json ./

RUN npm ci --ignore-scripts

COPY ./script ./script
RUN npm run compile-dict

COPY ./tsconfig.json ./prisma/schema.prisma ./
COPY ./src ./src
RUN npm run build

FROM base AS runner

WORKDIR /app
ENV NODE_ENV production

RUN apt-get update -y&&apt-get install -y python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./prisma ./prisma
COPY ./package*.json ./

RUN sed '/prepare/d' -i package.json
RUN npm ci

RUN apt-get remove -y python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dictionary ./dictionary

CMD ["npm", "start"]
