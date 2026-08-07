FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run TypeScript using tsx as defined in package.json dev script, 
# or compile it first if this was for production.
# For now, we will use the dev script to run it.
CMD ["npm", "run", "dev"]
