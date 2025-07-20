# Dockerfile

# Stage 1: Builder
# This stage installs dependencies and builds the Next.js application.
FROM node:20-alpine AS builder
# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps to handle potential peer dependency conflicts gracefully.
RUN npm install --legacy-peer-deps

# Copy the rest of the application source code
COPY . .

# Build the Next.js application for production
# The NEXT_TELEMETRY_DISABLED=1 variable prevents Next.js from collecting telemetry data.
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Runner
# This stage creates the final, lean image for running the application.
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Set the user to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the default command to start the app
# The "start" script in package.json runs `next start`
CMD ["npm", "start", "--", "-p", "3000"]
