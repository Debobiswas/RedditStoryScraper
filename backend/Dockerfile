FROM node:18-alpine

WORKDIR /app

# Install Python and yt-dlp for background downloads
RUN apk add --no-cache python3 py3-pip \
    && pip3 install --no-cache-dir yt-dlp

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads output temp

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]