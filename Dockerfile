FROM node:18-alpine

# 1. Create the working directory at '/home/node/app' and give node use permissions
RUN mkdir -p /home/node/app/node_modules

# 2. Set the working directory
WORKDIR /home/node/app

# 3. Copy the package.json and lock
COPY ./package*.json ./

# 4. Give node user permissions
RUN chown -R node:node /home/node/app

# 5. Switch to non-root user
USER node

# 6. Install deps
RUN npm install

# 7. Copy the app
COPY --chown=node:node . ./

# 8. Run
CMD [ "npx", "hardhat", "run", "scripts/deployment/passport/deployTestnet.ts", "--network", "localhost" ]