# Step 1: Start with a standard Node image
FROM node:20-bookworm

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files and install npm packages
COPY package*.json ./
# RUN npm ci
RUN npm install

# Step 4: Install Playwright browsers AND their system dependencies
RUN npx playwright install --with-deps

# Step 5: Copy application code
COPY . .

# FIX STEP: Compile the TypeScript/NestJS code into the 'dist' folder
RUN npm run build

# Step 6: Run your script
CMD ["npm", "start"]
