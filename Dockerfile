FROM node AS builder

WORKDIR /app
COPY package*.json ./

RUN npm i

COPY ./src ./src
RUN npm run build

FROM node AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder app/dist ./dist
COPY package*.json ./
RUN npm ci --ignore-script

CMD ["npm", "start"]
