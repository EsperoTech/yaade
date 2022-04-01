cd ../dev-proxy

node index.js &

cd ../server

export YAADE_ADMIN_USERNAME=admin
java -jar build/libs/yaade-server-1.0-SNAPSHOT.jar &

cd ../client

npm run dev
