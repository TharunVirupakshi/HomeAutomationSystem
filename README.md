#### MQTT Broker Setup on Docker

Open the `./MasterServer/MQTTBroker` inside terminal and run

```
docker-compose up
```

Use Postman and connect to `mqtt://localhost:1883`. You can create topics, subscribe to topics and publish messages within Postman to test the server.