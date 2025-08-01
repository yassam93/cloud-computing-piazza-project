# Using a lightweight base image with Node.js pre-installed
FROM node:18-alpine

# Setting the working directory inside the container
WORKDIR /app


COPY package*.json ./

# Installing the application dependencies
RUN npm install

# Copying  the  application code into the container
COPY . .

# Expose the port application runs on
EXPOSE 3000

# The command to start  application
CMD ["node", "app.js"]