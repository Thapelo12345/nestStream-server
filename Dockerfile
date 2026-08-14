# 1. Use the official Playwright environment as the base image
FROM ://microsoft.com

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package configuration files
COPY package*.json ./

# 4. Install production dependencies
RUN npm ci --omit=dev

# 5. Copy the rest of your server application files
COPY . .

# 6. Expose the port your server listens on (Render uses port 10000 by default)
EXPOSE 10000

# 7. Start your server
CMD [ "node", "src/index.js" ]