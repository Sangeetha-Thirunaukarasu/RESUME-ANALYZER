# --- Stage 1: Build the React Application compilation layers ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install packages cleanly
COPY package.json ./
RUN npm install

#Explicitly copy style configuration layers into the build frame first
COPY tailwind.config.js tsconfig.json vite.config.ts postcss.config.js index.html ./

# Copy the complete source directory layout
COPY src/ ./src/

# Compile optimized static code tree deployment production build assets
RUN npm run build


# --- Stage 2: Serve optimized static tree via NGINX ---
FROM nginx:1.25-alpine

# Copy custom minified production assets straight from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose native client web traffic portal boundary limits
EXPOSE 80

# Kickstart NGINX in foreground execution space to keep container live
CMD ["nginx", "-g", "daemon off;"]