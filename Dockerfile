# ==========================================
# STAGE 1: Build & Install Dependencies
# ==========================================
FROM ://microsoft.com AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for compiling code)
RUN npm ci

# Copy the rest of your application code
COPY . .

# If you are using TypeScript / NestJS, uncomment the build command below:
# RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM ://microsoft.com AS runner

WORKDIR /app

# Configure environmental variables for production
ENV NODE_ENV=production
ENV PORT=10000

# Copy package configurations
COPY package*.json ./

# Install only production dependencies to save space
RUN npm ci --omit=dev

# Copy compiled application code from the builder stage
# (If using TypeScript, change '.' to your output build folder, e.g., 'COPY --from=builder /app/dist ./dist')
COPY --from=builder /app ./

# Render routes network traffic via port 10000 by default
EXPOSE 10000

# Start your Node server (Update to 'node dist/main.js' if using NestJS/TypeScript)
CMD [ "node", "src/index.js" ]