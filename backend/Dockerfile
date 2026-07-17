# Build context: backend/
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
# Dummy URL only for prisma generate during image build
ENV DATABASE_URL="postgresql://inova:inova@localhost:5432/crm?schema=public"
# postinstall runs prisma generate — schema must exist first
RUN npm install

COPY tsconfig.json nest-cli.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
