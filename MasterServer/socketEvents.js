

const socketEvents = {
    // Events for device discovery
    DISCOVER_DEVICES: "DISCOVER_DEVICES",
    DEVICE_LIST: "DEVICE_LIST",
  
    // Events for status checks
    STATUS_CHECKER: "status-checker",
    PIN_STATUS: "PIN_STATUS",
  
    // Events for device control
    CONTROL_DEVICE: "control-device",
    DEVICE_ACK: "DEVICE-ACK",
  
    // Events for device info
    GET_INFO: "get-info",
    DEVICE_INFO: "DEVICE-INFO",
  
    // General events
    DISCONNECT: "disconnect",
  };
  
  module.exports = socketEvents;
  