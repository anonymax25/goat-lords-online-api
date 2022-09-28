FROM node:12.18.2

ENV ENV prod

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
EXPOSE 3001

CMD [ "npm", "run", "start:prod" ]