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

io.on('connection',(socket)=>{
    console.log('client connected: ',socket.id);
    socket.on('hello',(data)=>{
        console.log(data);
        servers.push(data.id);
        socket.join(data.id);
    });
})

app.get('/cloud_api/devices',(req,res)=>{
    const user=req['user'];
    res.status(200).json(servers);
});

app.get('/cloud_api/devices/connect',(req,res)=>{
    console.log(req.body);
    const msg=req.body;
    console.log('recieved: ',msg.serverId,msg.topic,msg.data);
    io.to(msg.serverId).emit(msg.topic,msg.data);
    res.status(200);
})

app.listen(8080,()=>{
    console.log('cloud running on port 8080');
});
