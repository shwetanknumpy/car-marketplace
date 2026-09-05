FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Production dependencies only; devDependencies (jest, eslint) are not shipped.
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Run as an unprivileged user rather than root.
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:nodejs package.json ./
COPY --chown=appuser:nodejs src ./src

USER appuser

EXPOSE 3000

# The app already exposes a health endpoint that reports DB connection state.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
