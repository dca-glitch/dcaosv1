FROM node:20-bookworm AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/data/package.json packages/data/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY . .

RUN npm run -w @dca-os-v1/data prisma:generate
RUN npm run -w @dca-os-v1/api build
RUN npm run -w @dca-os-v1/web build

FROM node:20-bookworm AS runtime

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/data/package.json packages/data/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev

COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client node_modules/@prisma/client
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/packages/data/prisma packages/data/prisma

EXPOSE 4000

CMD ["npm", "run", "-w", "@dca-os-v1/api", "start"]
