# move to root folder
cd ..

# build client
cd client/
npm run build
cd ..

# move client build into server
rm -rf server/src/main/resources/webroot
mv client/dist server/src/main/resources/webroot

# build server
cd server
./gradlew clean build

# build the docker container
docker buildx build --push --platform linux/arm64/v8,linux/amd64 --tag esperotech/yaade:nightly .
