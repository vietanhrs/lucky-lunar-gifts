FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

ENV PORT=8787
EXPOSE 8787

CMD ["bun", "src/index.ts"]
