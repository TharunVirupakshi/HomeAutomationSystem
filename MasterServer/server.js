const mqtt = require("mqtt");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const socketEvents = require("./socketEvents");
const { parse } = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const op= require('socket.io-client');

const socket= op('http://localhost:5000');
var conn=false;
var reqId;

socket.on('connect', () => {
  console.log('Connected to the cloud server with ID:', socket.id);

  conn=true;

  // Send a message to the server
  socket.emit('hello', {'id':'1'});
});

socket.on(socketEvents.DISCOVER_DEVICES, () => {
  console.log(`[INFO] DISCOVER_DEVICES event received from client: ${socket.id}`);
  // console.log(`[ACTION] Joining room: device-discovery`);

  discover();
});

socket.on(socketEvents.GET_PIN_STATUS, ({ data}) => {
  const id=data.id;
  const pin_no=data.pin_no;
  reqId=data.requestId;
  const room = `pin-status-check-${id}`;
  console.log("recieved data",data);
  console.log(`[INFO] GET_PIN_STATUS event received from client: ${socket.id}`); 

  statuscheck(id, pin_no);
});

socket.on(socketEvents.GET_DEVICE_INFO, ({ data }) => {
  const id=data.id;
  reqId=data.requestId;
  console.log("recieved data",data);
  const room = `device-info-${id}`;
  console.log(`[INFO] GET_DEVICE_INFO event received from client: ${socket.id}`);;

  getInfo(id);
});

socket.on(socketEvents.CONTROL_DEVICE,({data})=>{
  const id=data.id;
  const pin_no=data.pin_no;
  const state=data.state;
  reqId=data.requestId;
  const room=`device-ack-${id}`;
  control(id,pin_no,state);
});

socket.on("disconnect", () => {
  console.log(`Client disconnected: ${socket.id}`);
});

// Array to store device IDs
const devices = [{device_id: "device_1", status: "OFFLINE"}];
const deviceStatus = {}; // Track status for each device  
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
  publish("device-discovery/get","discovery request");
};

const checkDevicesHeartBeat = () => {
  // Subscribe to the required devices
  devices.forEach((device) =>  subscribe(`${device.device_id}/info`))
 
  setInterval(() => {
    devices.forEach((device) => {
      publish(`${device.device_id}/info/get`, "ping");
    })
  }, 10000)
  setInterval(() => {
    const now = Date.now();
    devices.forEach(({ device_id }) => {
      if (!deviceStatus[device_id] || now - deviceStatus[device_id].lastSeen > 10000) {
        deviceStatus[device_id] = { online: false };
      }

      // Publish a message to alert other subscribers of this topic
      if(!deviceStatus[device_id] || !deviceStatus[device_id].online){
        publish(`${device_id}/info`, JSON.stringify({ status: "OFFLINE" }))
      } 
      console.log(`Device ${device_id} is ${deviceStatus[device_id].online ? "ONLINE" : "OFFLINE"}.`);
    });
  }, 10000); // Check every 10 seconds
}

checkDevicesHeartBeat()


// Function to check the status of a device's pin(s)
const statuscheck = (id, pin_no) => {
  if (!id) {
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

const control = (id, pin_no, state) => {
  if (!id) {
    console.error("Invalid device ID provided.");
    return;
  }
  subscribe(`${id}/pin/${pin_no}/set/ack`);
  publish(`${id}/pin/${pin_no}/set`, state);
};

const getInfo = (id) => {
  subscribe(`${id}/info`);
  publish(`${id}/info/get`, "get info");
};


// Define handlers for specific topics
const handleDeviceDiscovery = (message) => {
  
  try {
    console.log(`[INFO] Discovery message received: ${message}`);
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

  try {
    console.log("[INFO] Received:", JSON.parse(message));
    const parsedMessage = JSON.parse(message);

    const topicParts = topic.split("/");
    const device_id = topicParts[0];

    if(conn==true)
      socket.emit("response",{reqId,...parsedMessage});

    const room = `pin-status-check-${device_id}`;
    io.to(room).emit(socketEvents.PIN_STATUS, {
      device_id,
      pins: parsedMessage
    });
  } catch (error) {
    console.error(`[ERROR] Failed to process pin status message: ${error.message}`);
  } 
  
};

const handleSpecificPinStatus = (message, topic) => {  
  try {
    console.log("[INFO] Received:", JSON.parse(message));
    const parsedMessage = JSON.parse(message);

    if(!parsedMessage.state){
      console.warn(`[WARN] Invalid Pin Status message: ${message}`);
      return; 
    }

    const topicParts = topic.split("/");
    const device_id = topicParts[0];
    const pin_no = topicParts[2];

    if(conn==true)
      socket.emit("response",{reqId,...parsedMessage});

    const room = `pin-status-check-${device_id}`;
    io.to(room).emit(socketEvents.PIN_STATUS, {
      device_id,
      pin_no,
      state: parsedMessage.state
    });
  } catch (error) {
    console.error(`[ERROR] Failed to process pin status message: ${error.message}`);
  } 
  
};

const handleAck = (message, topic) => {


  
  try {
    console.log("[INFO] Received:", JSON.parse(message));
    const parsedMessage = JSON.parse(message);

    if(!parsedMessage.pin){
      console.warn(`[WARN] Invalid Pin Ack message: ${message}`);
      return; 
    }

    const topicParts = topic.split("/");
    const device_id = topicParts[0];

     if(conn==true)
      socket.emit("response",{reqId,...parsedMessage});

    const room = `device-ack-${device_id}`;
    io.to(room).emit(socketEvents.DEVICE_ACK, {
      device_id,
      ...parsedMessage
    });
  } catch (error) {
    console.error(`[ERROR] Failed to process pin status message: ${error.message}`);
  } 
};


const handleDeviceInfo = (message, topic) => {
  try {
    console.log("[INFO] Received:", JSON.parse(message));
    const parsedMessage = JSON.parse(message);

    if(!parsedMessage.status){
      console.warn(`[WARN] Invalid Device Info message: ${message}`);
      return; 
    }

    const topicParts = topic.split("/");
    const device_id = topicParts[0];
    
    if(parsedMessage.status === 'ACTIVE')
      deviceStatus[device_id] = { online: true, lastSeen: Date.now() };

    if(conn==true)
      socket.emit("response",{reqId,...parsedMessage});


    const room = `device-info-${device_id}`;
    io.to(room).emit(socketEvents.DEVICE_INFO, {
      device_id,
      ...parsedMessage
    });
  } catch (error) {
    console.error(`[ERROR] Failed to process pin status message: ${error.message}`);
  } 
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
  { match: (topic) => topic.endsWith("set/ack"), handler: handleAck },
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
    // console.log(`[ACTION] Joining room: device-discovery`);

    socket.join("device-discovery");
    discover();
  });

  socket.on(socketEvents.GET_PIN_STATUS, ({ id, pin_no }) => {
    const room = `pin-status-check-${id}`;
    console.log(`[INFO] GET_PIN_STATUS event received from client: ${socket.id}`); 
    socket.join(room);
    statuscheck(id, pin_no);
  });

  socket.on(socketEvents.GET_DEVICE_INFO, ({ id }) => {
    const room = `device-info-${id}`;
    console.log(`[INFO] GET_DEVICE_INFO event received from client: ${socket.id}`);;
    socket.join(room);
    getInfo(id);
  });

  socket.on(socketEvents.CONTROL_DEVICE,({id,pin_no,state})=>{
    const room=`device-ack-${id}`;
    socket.join(room);
    control(id,pin_no,state);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

//Web socket logic
server.listen(3000, () => {
  console.log("Listening on *:3000");
});


