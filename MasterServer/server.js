const mqtt = require("mqtt");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const socketEvents = require("./socketEvents");

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

//subscription function
const subscribe = (topic) => {
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) console.error(`Subscription error for topic ${topic}:`, err.message);
    else console.log(`Subscribed to topic: ${topic}`);
  });
};


//publish function
const publish = (topic, message) => {
  client.publish(topic, message, { qos: 0 }, (err) => {
    if (err) console.error(`Publish error for topic ${topic}:`, err.message);
    else console.log(`[ACTION] Message published to ${topic}`);
  });
};



subscribe("device-discovery");



// Function for device discovery
const discover = () => {
  // const topics = ["device-discovery", "device-discovery/get"];
  // subscribe(topics);
  publish("device-discovery/get","discovery request");
};

// Function to check the status of a device's pin(s)
const statuscheck = (id, pin_no) => {
  if (!id || !Number.isInteger(parseInt(id))) {
    console.error("Invalid device ID provided.");
    return;
  }

  if (pin_no === "all") {
    subscribe(`${id}/pins/status`);
    publish(`${id}/pins/get`, "pin status");
  } else {
    subscribe(`${id}/pin/${pin_no}/status`);
    publish(`${id}/pin/${pin_no}/get`,"pin status");
  }
};

const control = (id, pin_no, signal) => {
  subscribe(`${id}/pin/${pin_no}/ack`);
  publish(`${id}/pin/${pin_no}/set`, signal);
};

const getInfo = (id) => {
 subscribe(`${id}/info`);
  publish(`${id}/info/get`, "get info");
};


// Define handlers for specific topics
const handleDeviceDiscovery = (message) => {
  console.log(`[INFO] Discovery message received: ${message}`);

  try {
    // Parse the JSON message
    const parsedMessage = JSON.parse(message);

    // Validate required fields
    if (!parsedMessage.device_id || !parsedMessage.status) {
      console.warn(`[WARN] Invalid discovery message: ${message}`);
      return;
    }

    // Check if the device is already in the list
    const deviceExists = devices.some(
      (device) => device.device_id === parsedMessage.device_id
    );

    if (!deviceExists) {
      // Add new device to the list
      devices.push({
        device_id: parsedMessage.device_id,
        status: parsedMessage.status,
      });
    } else {
      // Update the status of an existing device
      devices.forEach((device) => {
        if (device.device_id === parsedMessage.device_id) {
          device.status = parsedMessage.status;
        }
      });
    }

    console.log(`[INFO] Updated devices list: ${JSON.stringify(devices)}`);

    // Send updated devices list to the WebSocket clients
    io.to("device-discovery").emit(socketEvents.DEVICE_LIST, {
      success: true,
      message: "Device discovery completed",
      devices: devices,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to process discovery message: ${error.message}`);
  }
};


const handlePinStatus = (message, topic) => {
  console.log("Received:", JSON.parse(message));
  const msg = JSON.parse(message);
  const room = `status-check-${msg.id}`;
  io.to(room).emit("PIN_STATUS", msg);
};

const handleSpecificPinStatus = (message, topic) => {
  console.log(`Specific pin status received: ${message}`);
  const msg = JSON.parse(message);
  const room = `status-check-${msg.id}`;
  io.to(room).emit("PIN_STATUS", msg);
};

const handleAck = (message, topic) => {
  console.log(`Received ack: ${message}`);
  const msg = JSON.parse(message);
  const room = `control-device-${msg.id}`;
  io.to(room).emit("DEVICE-ACK", msg);
};

const handleDeviceInfo = (message, topic) => {
  console.log(`Received info: ${message}`);
  const msg = JSON.parse(message);
  const room = `get-info-${msg.id}`;
  io.to(room).emit("DEVICE-INFO", msg);
};

// Default handler for unmatched topics
const handleUnknownTopic = (message, topic) => {
  console.warn(`Unhandled topic: ${topic}`);
};

// Topic handler map
const topicHandlers = [
  { match: (topic) => topic === "device-discovery", handler: handleDeviceDiscovery },
  { match: (topic) => topic.endsWith("/pins/status"), handler: handlePinStatus },
  { match: (topic) => topic.includes("/pin/") && topic.endsWith("/status"), handler: handleSpecificPinStatus },
  { match: (topic) => topic.endsWith("/ack"), handler: handleAck },
  { match: (topic) => topic.endsWith("/info"), handler: handleDeviceInfo },
];

// Main message handler
client.on("message", (topic, message) => {
  const messageString = message.toString();

  // Find and execute the appropriate handler
  const handlerEntry = topicHandlers.find((entry) => entry.match(topic));
  if (handlerEntry) {
    handlerEntry.handler(messageString, topic);
  } else {
    handleUnknownTopic(messageString, topic);
  }
});


io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on(socketEvents.DISCOVER_DEVICES, () => {
    console.log(`[INFO] DISCOVER_DEVICES event received from client: ${socket.id}`);
    console.log(`[ACTION] Joining room: device-discovery`);

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
