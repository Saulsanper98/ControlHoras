FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# El servidor Ubuntu de despliegue no tiene por qué estar en la zona horaria
# de Madrid; sin esto, Node usa UTC por defecto y "mes actual"/fechas cerca de
# medianoche en España se calculan mal (p. ej. días 1 y 31 se confunden).
ENV TZ=Europe/Madrid

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# The standalone output above only traces node_modules actually imported by
# the Next.js server bundle, so it does not include the Prisma CLI (used only
# by docker-entrypoint.sh to run migrations, not by the app itself) or its
# transitive dependencies. Overwrite with the full node_modules from the
# builder stage to guarantee `prisma migrate deploy` works at container start.
COPY --from=builder /app/node_modules ./node_modules
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
