# Use an official Node.js runtime as the base image
# linux/arm64/v8 and linux/amd64
ARG NODE_CONTAINER_VERSION='lts-alpine'
FROM node:NODE_CONTAINER_VERSION

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application code to the working directory
COPY lib/* .

# Set the command to run your app (replace "index.js" with your app's entry point)
CMD [ "node", "app/index.js" ]