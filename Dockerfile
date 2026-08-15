# --- Stage 1: Build the application ---
FROM ://microsoft.com AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including typescript/compiler)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build/Compile the TypeScript code (Generates the /app/dist folder)
RUN npm run build


# --- Stage 2: Run the application ---
FROM ://microsoft.com

WORKDIR /app

# Copy package files and install only production dependencies to keep it light
COPY package*.json ./
RUN npm ci --only=production

# CRUCIAL: Copy the compiled 'dist' folder from the builder stage
COPY --from=builder /app/dist ./dist

# Expose your NestJS port (usually 3000)
EXPOSE 3000

# Start the compiled app
CMD ["npm", "start"]
