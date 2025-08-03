# Estágio de build
FROM node:24.4.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de produção
# FROM node:24.4.1-alpine
# WORKDIR /app
# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/next.config.ts ./next.config.ts

# CMD ["npm", "start"]
