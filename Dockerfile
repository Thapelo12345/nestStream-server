# ==========================================
# STAGE 1: Build & Compile TypeScript
# ==========================================
FROM https://microsoft.com AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install ALL dependencies (including devDependencies like typescript)
RUN npm ci

# Copy the rest of your application code
COPY . .

# Compile your TypeScript code into JavaScript
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM https://microsoft.com AS runner

WORKDIR /app

# Configure environmental variables for production
ENV NODE_ENV=production
ENV PORT=10000

# Copy package configurations
COPY package*.json ./

# Install only production dependencies to save space
RUN npm ci --omit=dev

# Copy compiled application code from the builder stage
COPY --from=builder /app/dist ./dist

# Render routes network traffic via port 10000 by default
EXPOSE 10000

# Start your Node server using your package.json start script
CMD [ "npm", "start" ]
