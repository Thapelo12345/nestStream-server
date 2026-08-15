FROM https://microsoft.com AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM https://microsoft.com AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 10000
CMD [ "npm", "start" ]
