

const socketEvents = {
    // Events for device discovery
    DISCOVER_DEVICES: "DISCOVER_DEVICES",
    DEVICE_LIST: "DEVICE_LIST",
  
    // Events for status checks
    GET_PIN_STATUS: "GET_PIN_STATUS",
    PIN_STATUS: "PIN_STATUS",
  
    // Events for device control
    CONTROL_DEVICE: "CONTROL_DEVICE",
    DEVICE_ACK: "DEVICE_ACK",
  
    // Events for device info
    GET_DEVICE_INFO: "GET_DEVICE_INFO",
    DEVICE_INFO: "DEVICE_INFO",
  
    // General events
    DISCONNECT: "disconnect",


    cloud: {
      // MasterServer-Cloud-App Events
      REGISTER_MASTER_SERVER: "REGISTER_MASTER_SERVER",
      TO_APP: "TO_APP",
      PING_REQ: "PING_REQ",
      PING_RES: "PING_RES"
    }
   
  };
  
  module.exports = socketEvents;
  