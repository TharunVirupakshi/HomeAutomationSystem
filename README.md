#### MQTT Broker Setup on Docker

Open the `./MasterServer/MQTTBroker` inside terminal and run

```
docker-compose up
```

Use Postman and connect to `mqtt://localhost:1883` or `mqtts://localhost:8883` for secure connection. You can create topics, subscribe to topics and publish messages within Postman to test the server.

##### Subscribe to topics from your client (Postman/ MQTTX)
`+` is a [MQTT Wildcard](https://www.emqx.com/en/blog/advanced-features-of-mqtt-topics#:~:text=MQTT%20wildcards%20are,(multi%2Dlevel).). 
- `+/pin/+/status` - Receives status info of all pins of all devices.
- `+/pin/+/set/ack` - Receives ack
- `+/pins/status` - Receives status of all pins of all devices.
- `device-discovery` - Receives ID's of connected ESP32 devices.
- `+/info` - Receives info of devices. 

#### MQTT Topics structure

##### 1. Device Discovery
- Subscribe to `device-discovery` topic from your client to receive messages from ESP32 devices. ESP32 devices publish their ID's here upon connecting to the MQTT Broker.
- Send a empty message to `device-discovery/get` topic to have the ESP32 devices to resend their IDs to `device-discovery`
###### Example response:
```json
{
  "device_id": "device_1",
  "status": "ONLINE"
}
```

##### 2. Fetching specific device info
-  Send a empty message to `<device_id>/info/get` to get info of the device at `<device_id>/info`.
###### Example response:
```json
{
  "status": "ACTIVE"
}
```
##### 3. Getting and Setting states of PINS
-  Send a empty message to `<device_id>/pin/<pin_no>/get` to receive state info at `<device_id>/pin/<pin_no>/status`.
> NOTE : Pin status is updated to `<device_id>/pin/<pin_no>/status` whenever the pin state changes. ESP32 checks for pin states every 500ms and updates to MQTT Broker only if the state has changed.
###### Example response:
```json
{
  "state": "LOW"
}
```
-  Send a empty message to `<device_id>/pins/get` to receive state info of all pins at `<device_id>/pins/status`
###### Example response:
```json
{
  "pin4": "LOW",
  "pin18": "LOW",
  "pin19": "LOW"
}
```
-  Send `HIGH` or `LOW` to `<device_id>/pin/<pin_no>/set` to set the state of the pin. The acknowledgement of the same pin is received at `<device_id>/pin/<pin_no>/set/ack`.
(The status of the pin is published back to `<device_id>/pin/<pin_no>/status`)
###### Example response:
- ###### Success
*Topic: device_1/pin/4/set/ack* 

```json
{
  "success": true,
  "pin": 4
}
```
*Topic: device_1/pin/4/status*
```json
{
  "state": "HIGH"
}
```
- ###### Failure
*Topic: device_1/pin/4/set/ack*
```json
{
  "error": "Invalid state HIg", 
  "pin": 4
}
```

*Topic: device_1/pin/4/set/ack*
```json
{
  "error": "Invalid pin",
  "pin": 20
}
```

