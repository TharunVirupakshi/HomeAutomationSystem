const mqtt = require("mqtt");
const fs = require("fs");

// Define broker details
const options = {
  host: "localhost", // Replace with your broker's hostname or IP
  port: 8883, // Port for MQTTS
  protocol: "mqtts", // Protocol for secure MQTT
  ca: fs.readFileSync("./certificates/ca.crt"), // CA certificate path
  cert: fs.readFileSync("./certificates/client.crt"), // Client certificate path
  key: fs.readFileSync("./certificates/client.key"), // Client private key path
  rejectUnauthorized: false, // Ensure only trusted certificates are allowed
};

// Connect to the broker
const client = mqtt.connect(options);

// Event: On connection success
client.on("connect", () => {
  console.log("Connected to MQTTS broker!");

  // Subscribe to a topic
  const topic = "test/topic";
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error("Subscription error:", err.message);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });

  // Publish a message to the topic
  const message = "Hello, secure MQTT!";
  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error("Publish error:", err.message);
    } else {
      console.log(`Message published: ${message}`);
    }
  });
});

// Event: On receiving a message
client.on("message", (topic, message) => {
  console.log(`Received message on topic '${topic}': ${message.toString()}`);
});

// Event: On connection error
client.on("error", (err) => {
  console.error("Connection error:", err.message);
});

// Event: On connection close
client.on("close", () => {
  console.log("Connection closed.");
});
