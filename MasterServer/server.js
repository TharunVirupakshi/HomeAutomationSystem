const mqtt = require("mqtt");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Array to store device IDs
const devices = [];
let curid = 0;

// Define broker details
const options = {
  host: "localhost",
  port: 8883,
  protocol: "mqtts",
  ca: fs.readFileSync("./certificates/ca.crt"),
  cert: fs.readFileSync("./certificates/client.crt"),
  key: fs.readFileSync("./certificates/client.key"),
  rejectUnauthorized: false,
};

// Connect to the broker
const client = mqtt.connect(options);

// Event: On connection success
client.on("connect", () => {
  console.log("Connected to MQTTS broker!");
});

// Event: On connection error
client.on("error", (err) => {
  console.error("Connection error:", err.message);
});

// Event: On connection close
client.on("close", () => {
  console.log("Connection closed.");
});

// Function for device discovery
const discover = () => {
  const topics = ["device-discovery", "device-discovery/get"];

  client.subscribe(topics, { qos: 1 }, (err) => {
    if (err) {
      console.error("Subscription error:", err.message);
    } else {
      console.log(`Subscribed to topics: ${topics.join(", ")}`);
    }
  });

  client.publish(
    "device-discovery/get",
    "Discovery request",
    { qos: 1 },
    (err) => {
      if (err) {
        console.error("Publish error:", err.message);
      } else {
        console.log("Discovery request sent.");
      }
    }
  );
};

// Function to check the status of a device's pin(s)
const statuscheck = (id, pin_no) => {
  if (!id || !Number.isInteger(parseInt(id))) {
    console.error("Invalid device ID provided.");
    return;
  }

  if (pin_no === "all") {
    const topic = `${id}/pins/status`;
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error("Subscription error:", err.message);
      else console.log(`Subscribed to topic: ${topic}`);
    });
    client.publish(`${id}/pins/get`, "pin status", { qos: 1 }, (err) => {
      if (err) console.error("Publish error:", err.message);
    });
  } else {
    const topic = `${id}/pin/${pin_no}/status`;
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error("Subscription error:", err.message);
      else console.log(`Subscribed to topic: ${topic}`);
    });
    client.publish(
      `${id}/pin/${pin_no}/get`,
      "pin status",
      { qos: 1 },
      (err) => {
        if (err) console.error("Publish error:", err.message);
      }
    );
  }
};

const control = (id, pin_no, signal) => {
  client.subscribe(`${id}/pin/${pin_no}/ack`, { qos: 1 }, (err) => {
    if (err) console.error("Subscription error:", err.message);
    else console.log(`Subscribed to topic ack`);
  });
  client.publish(`${id}/pin/${pin_no}/set`, signal, { qos: 1 }, (err) => {
    if (err) {
      console.log("error:", err.message);
    } else {
      console.log("set pin to: ", signal);
    }
  });
};

const getInfo = (id) => {
  client.subscribe(`${id}/info`, { qos: 1 }, (err) => {
    if (err) console.error("Subscription error:", err.message);
    else console.log(`Subscribed to to info`);
  });
  client.publish(`${id}/info/get`, "get info", { qos: 1 }, (err) => {
    if (err) {
      console.log("error:", err.message);
    } else {
      console.log("sent info req");
    }
  });
};
var messageString;
// Handle all incoming messages
client.on("message", (topic, message) => {
  messageString = message.toString();

  if (topic === "device-discovery") {
    console.log(`Discovery message received: ${messageString}`);
    const lines = messageString.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !devices.includes(trimmedLine)) {
        devices.push(trimmedLine);
      }
    });
    console.log("Updated devices list:", devices);
    io.to("device-discovery").emit("DEVICE_DISCOVERY", devices);
  } else if (topic.endsWith("/pins/status")) {
    console.log("Received", JSON.parse(message));
    const msg = JSON.parse(message);
    const room = `status-check-${msg.id}`;
    io.to(room).emit("PIN_STATUS", msg);
  } else if (topic.includes("/pin/") && topic.endsWith("/status")) {
    console.log(`Specific pin status received: ${messageString}`);
    console.log("Received", JSON.parse(message));
    const msg = JSON.parse(message);
    const room = `status-check-${msg.id}`;
    io.to(room).emit("PIN_STATUS", msg);
  } else if (topic.endsWith("/ack")) {
    console.log(`recieved ack: ${messageString}`);
    const msg = JSON.parse(message);
    const room = `control-device-${msg.id}`;
    io.to(room).emit("DEVICE-ACK", msg);
  } else if (topic.endsWith("/info")) {
    console.log(`recieved info: ${JSON.parse(messageString)}`);
    console.log("Received", JSON.parse(message));
    const msg = JSON.parse(message);
    const room = `get-info-${msg.id}`;
    io.to(room).emit("DEVICE-INFO", msg);
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("discover-devices", () => {
    socket.join("device-discovery");
    discover();
  });

  socket.on("status-checker", ({ id, pin_no }) => {
    const room = `status-check-${id}`;
    console.log(id, pin_no);
    socket.join(room);
    statuscheck(id, pin_no);
  });

  socket.on("get-info", ({ id }) => {
    const room = `get-info-${id}`;
    console.log(id);
    socket.join(room);
    getInfo(id);
  });

  socket.on("control-device",({id,pin_no,signal})=>{
    const room=`control-device-${id}`;
    socket.join(room);
    control(id,pin_no,signal);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

//Web socket logic
server.listen(3000, () => {
  console.log("Listening on *:3000");
});
