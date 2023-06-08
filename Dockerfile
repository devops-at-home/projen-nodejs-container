# Use an official Node.js runtime as the base image
# linux/arm64/v8 and linux/amd64
ARG NODE_CONTAINER_VERSION='lts-alpine'

FROM node:$NODE_CONTAINER_VERSION as builder

# Set the working directory in the container
WORKDIR /build

COPY . /build/

RUN yarn install \
    && yarn build

FROM node:$NODE_CONTAINER_VERSION

# Copy the rest of the application code to the working directory
COPY --from=builder /build/lib/* /app/

# Set the command to run your app (replace "index.js" with your app's entry point)
CMD [ "/bin/node", "/app/index.js" ]

