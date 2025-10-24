FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY .env* ./

RUN yarn build

FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./
COPY src ./src
COPY tsconfig.json ./

USER nodejs

EXPOSE 4000

# Use nodemon for development, node for production
CMD ["yarn", "dev"]