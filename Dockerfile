# Single-teacher Meaify. SQLite and uploads live on volumes.
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate && bun run build

FROM oven/bun:1
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/meaify.db
ENV UPLOADS_DIR=/data/uploads
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/rubrics ./rubrics
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["sh", "-c", "mkdir -p /data/uploads && bunx prisma db push --accept-data-loss && bun server.js"]
