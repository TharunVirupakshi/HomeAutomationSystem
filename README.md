#### MQTT Broker Setup on Docker

Open the `./MasterServer/MQTTBroker` inside terminal and run

cd MasterServer

npm install mqtt


```
docker-compose up
```

node server.js

Use Postman and connect to `mqtt://localhost:1883`. You can create topics, subscribe to topics and publish messages within Postman to test the server.