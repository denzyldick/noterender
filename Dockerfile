FROM node

RUN apt-get update -y
RUN apt-get install -y node npm
ADD ./package.json /code/package.json

ADD ./package-lock.json /code/package-lock.json
WORKDIR /
