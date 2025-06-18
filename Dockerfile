# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DOCKER_ENV=true

# Health check for WebSocket server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const WebSocket = require('ws'); const ws = new WebSocket('ws://localhost:3000'); ws.on('open', () => { process.exit(0); }); ws.on('error', () => { process.exit(1); }); setTimeout(() => { process.exit(1); }, 5000);"

# Start the application
CMD ["npm", "start"] 