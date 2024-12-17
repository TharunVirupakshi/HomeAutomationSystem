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
const http = require("http");
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const express= require('express');
const app = express();
// Middleware
app.use(bodyParser.json());
const server = http.createServer(app)
const io = new Server(server);

app.use(express.json());

const servers=[];
const esps=[];

// Store pending acknowledgments
const pendingAcks = new Map();

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

const MQTTclient= mqtt.connect(options);

const EventEmitter = require('events');
const responseEmitter = new EventEmitter();


//socket for cloud and esp
// Event: On connection success
MQTTclient.on("connect", () => {
    console.log("Connected to MQTT broker!");
    // MQTTclient.subscribe('+/ack')
});

// Event: On connection error
MQTTclient.on("error", (err) => {
    console.error("Connection error:", err.message);
});


const publish = (topic, message) => {
    MQTTclient.publish(topic, message, {
        qos: 0
    }, (err) => {
        if (err) console.error(`Publish error for topic ${topic}:`, err.message);
        else console.log(`[ACTION] Message published to ${topic}`);
    });
};

MQTTclient.subscribe("device/info", {
    qos: 1
}, (err) => {
    if (err) console.error(`Subscription error for topic ${topic}:`, err.message);
    else console.log(`Subscribed to topic`);
});

MQTTclient.on('message', (topic, data) => {
    // if (topic === "device/info") {
    //     console.log(data.toString());
    //     esps.push(data.toString());
    // }

    if(topic.endsWith('ack')){
        const device_id = topic.split('/')[0];
        const payload = JSON.parse(data.toString());
        const reqId = payload.id;
        console.log(`[ACK] from:${device_id} with reqId: ${reqId}`);
        if(pendingAcks.has(reqId)){
            const resolve = pendingAcks.get(reqId);
            resolve(payload);
            pendingAcks.delete(reqId);
        }
    }


});

app.get('/test', async(req, res)=>{
    try {
        res.status(200).json({status: 'success', message: 'Hello!'});
    } catch (error) {
        res.status(504).json({ status: 'error', message: error.message });
    }
})

// REST API to Send Pairing Command
app.post('/api/pair-device', async (req, res) => {
  const { device_id, master_server_ip, master_server_hostname } = req.body;

  if (!device_id || !master_server_ip || !master_server_hostname) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate a unique ID for this request
  const uniqueId = uuidv4();

  // Prepare the message
  const topic = `${device_id}/cloud_commands`;
  const ackTopic = `${device_id}/ack`;
  const message = JSON.stringify({
    id: uniqueId,
    command: 'PAIR',
    payload: { master_server_ip, master_server_hostname },
  });

  console.log(`Publishing pairing request to ${topic}`);

  MQTTclient.subscribe(ackTopic);
  // Publish the message to the MQTT Broker
  MQTTclient.publish(topic, message, { qos: 1 });

  // Wait for acknowledgment with a 15-second timeout
  const ackPromise = new Promise((resolve, reject) => {
    pendingAcks.set(uniqueId, resolve);
    setTimeout(() => {
      if (pendingAcks.has(uniqueId)) {
        pendingAcks.delete(uniqueId);
        reject(new Error('Timeout: No acknowledgment received'));
      }
    }, 15000); // 20-second timeout
  });

  try {
    const ackResponse = await ackPromise;
    console.log(`ACK received for request ${uniqueId}:`, ackResponse);
    res.status(200).json({ status: 'success', ack: ackResponse });
  } catch (error) {
    console.error(error.message);
    res.status(504).json({ status: 'error', message: error.message });
  }
});


// WebSocket setup
io.on('connection', (socket) => {
    console.log('client connected: ', socket.id);

    socket.on('disconnect', () => {
        console.log('client disconnected: ', socket.id);
    })


    // Master server emits this event
    socket.on('REGISTER_MASTER_SERVER', ({masterServerId}) => {
        const toMaster = `To_MasterServer-${masterServerId}`;
        socket.join(toMaster);
        console.log(`Master server ${masterServerId} registered and joined ${toMaster}`);
    });

    // App emits this event
    socket.on('CONNECT_TO_MASTER_SERVER', ({masterServerId}) => {
        const fromMaster = `From_MasterServer-${masterServerId}`;
        const toMaster = `To_MasterServer-${masterServerId}`;

        // io.to(toMaster).emit('PING_REQ', {});
        
        socket.join(fromMaster);
        console.log(`App joined ${fromMaster}`);
    });

    // App emits this event
    socket.on('TO_MASTER_SERVER', ({
        masterServerId,
        event,
        payload
    }) => {

        const toMaster = `To_MasterServer-${masterServerId}`;
        // io.to(toMaster).emit('PING_REQ', {});
        io.to(toMaster).emit(event, payload);
        console.log(`Message sent to master server ${masterServerId}: ${event}`);
    });

    // Master server emits this event
    socket.on('TO_APP', ({
        masterServerId,
        event,
        payload
    }) => {
        const fromMaster = `From_MasterServer-${masterServerId}`;
        io.to(fromMaster).emit(event, payload);
        console.log(`Message sent from master server ${masterServerId} to app: ${event}`);
    });





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
server.listen(5001,()=>{
    console.log('cloud running on port 5001');
});
