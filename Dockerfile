FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM http://microsoft.com AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 10000
CMD [ "npm", "start" ]
