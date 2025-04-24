# Stage 1: Build
#FROM node:20-alpine AS builder
FROM ghcr.io/library/node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# Stage 2: Production
#FROM node:20-alpine
FROM ghcr.io/library/node:20-alpine AS builder

WORKDIR /app

# Copy package.json and node_modules and dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
