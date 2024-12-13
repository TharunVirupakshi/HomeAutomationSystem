/*TODO:

-app and cloud 
    - use rest api

-Master Server and cloud comm:
    -use web sockets
    -join each master server to its each room with its id as <room_name>
    -user commands is forwarded to room id respective socket. 

-esp and cloud comm
    -esp poll cloud per min at a endpoint(get) esp sends its device_id(to be stored in map)
    -Cloud maintains map of key:device_id and val:msg_pair
        -msg_pair:{cmd,payload}
    -when esp makes get req, cloud uses this map if(msg): send msg else: no message

-db schema(mongo_atlas): -owner{id,owner_name, list of device(device_ids), email}
            -device {id,type,hostname}
    
- pairing logic :
        -user fetches his list of devices 
        -select which device he needs to pair with which master server
        -connect slave to its master server
*/

const {Server} = require('socket.io');
const express= require('express');
const app= express();
const io= new Server(5000);

app.use(express.json());

const servers=[];
const esps=[];
const { connectToDatabase } = require('./db_connection.js');

const mqtt = require("mqtt");

const options = {
  host: "localhost",
  port: 6884,
  protocol: "mqtts",
//   ca: fs.readFileSync("./certificates/ca.crt"),
//   cert: fs.readFileSync("./certificates/client.crt"),
//   key: fs.readFileSync("./certificates/client.key"),
  rejectUnauthorized: false,
};

const client= mqtt.connect(options);

const EventEmitter = require('events');
const responseEmitter = new EventEmitter();


//socket for cloud and esp
// Event: On connection success
client.on("connect", () => {
    console.log("Connected to MQTTS broker!");
  });
  
  // Event: On connection error
  client.on("error", (err) => {
    console.error("Connection error:", err.message);
  });
  
  const publish = (topic, message) => {
    client.publish(topic, message, { qos: 0 }, (err) => {
      if (err) console.error(`Publish error for topic ${topic}:`, err.message);
      else console.log(`[ACTION] Message published to ${topic}`);
    });
  };

  client.subscribe("device/info", { qos: 1 }, (err) => {
    if (err) console.error(`Subscription error for topic ${topic}:`, err.message);
    else console.log(`Subscribed to topic`);
  });

  client.on('message',(topic,data)=>{
    if(topic==="device/info"){
        console.log(data.toString());
        esps.push(data.toString());
    }
  });


// WebSocket setup
io.on('connection', (socket) => {
    console.log('client connected: ', socket.id);

    socket.on('hello', (data) => {
        console.log(data);
        servers.push(data.id);
        socket.join(data.id);
    });

    socket.on('response', (data) => {
        console.log('WebSocket response received:', data);
        // Emit the response with a unique event key
        responseEmitter.emit(data.reqId, data);
    });
});

//Display and send the list of availiable devices 
app.get('/cloud_api/devices',async (req,res)=>{
    const userId = req.body.userId; // Assume userId is passed as a query parameter
    console
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const db = await connectToDatabase();

        // Fetch the owner document for the given user ID
        const owner = await db.collection('owners').findOne({ _id: userId });

        if (!owner) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        // Extract the array of device IDs
        const deviceIds = owner.device_ids || [];

        // Fetch the devices that match the device IDs
        const devices = await db.collection('devices').find({ _id: { $in: deviceIds } }).toArray();

        res.status(200).json({devices,esps});
    } catch (error) {
        console.error('Error fetching user devices:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});


app.get('/cloud_api/device/master',(req,res)=>{
    console.log(req.body);
    try{
         publish('device/connect',req.body.device_id,req.body.host_name);
    }catch(err){
        res.status(504).json({ error: 'Something went wrong' });
    }
    res.status(200).json({'status':'ok'});
   
})

// REST API setup
app.get('/cloud_api/devices/connect', async (req, res) => {
    console.log(req.body);
    const msg = req.body;
    console.log('Received:', msg.serverId, msg.topic, msg.data);

    const requestId = generateUniqueId(); // Generate a unique ID for this request
    msg.data.requestId = requestId;

    console.log(msg);
    // Emit the request to the specific server via WebSocket
    io.to(msg.serverId).emit(msg.topic, msg);

    try {
        // Wait for the response from the WebSocket client
        const responseData = await waitForResponse(requestId);
        res.status(200).json(responseData);
    } catch (error) {
        res.status(504).json({ error: 'Timeout waiting for response' });
    }
});

// Utility function to wait for WebSocket response
function waitForResponse(requestId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            responseEmitter.removeListener(requestId, onResponse);
            reject(new Error('Response timeout'));
        }, 10000); // 5 seconds timeout

        const onResponse = (data) => {
            clearTimeout(timeout); // Clear the timeout
            resolve(data); // Resolve the promise with the response data
        };

        responseEmitter.once(requestId, onResponse); // Listen for the response event once
    });
}

// Utility function to generate unique IDs
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}
app.listen(8080,()=>{
    console.log('cloud running on port 8080');
});
