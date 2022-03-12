FROM node:16-bullseye-slim AS base
RUN apt-get update -y&&apt-get install -y openssl\
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


FROM base AS builder

WORKDIR /app
COPY ./package*.json ./tsconfig.json ./prisma/schema.prisma ./

RUN npm ci --ignore-scripts

COPY ./src ./src
RUN npm run build

FROM base AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/dist ./dist
COPY ./prisma ./prisma
COPY ./script ./script
COPY ./package*.json ./

RUN sed '/prepare/d' -i package.json

RUN apt-get update -y&&apt-get install -y python3 curl g++ make \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
RUN npm ci
RUN apt-get remove -y python3 curl g++ make \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


CMD ["npm", "start"]
