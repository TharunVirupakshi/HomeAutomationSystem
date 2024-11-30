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


## **WebSocket Events**
### **Client-to-Server Events**
1. **`DISCOVER_DEVICES`**
   - **Description**: Requests the server to discover IoT devices.
   - **Payload**: None
   - **Server Action**:
     - Joins the client to the `device-discovery` room.
     - Triggers the MQTT discovery process.

2. **`GET_PIN_STATUS`**
   - **Description**: Requests the status of specific pins or all pins on a device.
   - **Payload**:
     ```json
     {
       "id": "device_id",
       "pin_no": "pin_number | 'all'"
     }
     ```
   - **Server Action**:
     - Joins the client to a room specific to the device and pin.
     - Publishes an MQTT request to fetch the pin status.

3. **`GET_DEVICE_INFO`**
   - **Description**: Requests detailed information about a device.
   - **Payload**:
     ```json
     {
       "id": "device_id"
     }
     ```
   - **Server Action**:
     - Joins the client to a `device-info` room.
     - Publishes an MQTT request for device information.

4. **`CONTROL_DEVICE`**
   - **Description**: Sends a control signal to a device pin.
   - **Payload**:
     ```json
     {
       "id": "device_id",
       "pin_no": "pin_number",
       "state": "HIGH | LOW"
     }
     ```
   - **Server Action**:
     - Joins the client to a `device-ack` room.
     - Publishes an MQTT message to set the pin state.

---

### **Server-to-Client Events**
1. **`DEVICE_LIST`**
   - **Triggered By**: Device discovery process.
   - **Payload**:
     ```json
     {
       "success": true,
       "message": "Device discovery completed",
       "devices": [
         {
           "device_id": "id",
           "status": "online | offline"
         }
       ]
     }
     ```

2. **`PIN_STATUS`**
   - **Triggered By**: Response to a pin status check.
   - **Payload**:
      <br>For all pins
     ```json
     {
       "device_id": "id",
       "pins": {
         "pin_number": "state"
       }
     }
     ```
     For single pin
     ```json
     {
        "device_id": "id",
        "pin_no": "pin_no",
        "state": "LOW | HIGH"
     }
     ```
     

3. **`DEVICE_INFO`**
   - **Triggered By**: Response to a device info request.
   - **Payload**:
     ```json
     {
       "device_id": "id",
       "status": "ONLINE | OFFLINE"
     }
     ```

4. **`DEVICE_ACK`**
   - **Triggered By**: Acknowledgment of a pin control action.
   - **Payload**:
     ```json
     {
      "device_id": "id",
      "success": true | false,
      "pin": 18
     }
     ```

---