import axios from "axios";
import { io, Socket } from "socket.io-client";

// Base URL for the MasterServer (replace with your actual server address)
const BASE_URL = "https://your-master-server.com/api";
// const SOCKET_URL = "http://Tharuns-MacBook-Air.local:3000";
const SOCKET_URL = "http://192.168.43.74:3000";

let socket: Socket | null = null;
let connectionStatusCallbacks: Array<(status: boolean) => void> = []; // Array to manage multiple callbacks

// Register a callback for connection status changes
export const onConnectionStatusChange = (callback: (status: boolean) => void) => {
  connectionStatusCallbacks.push(callback);

  // Immediately notify the current connection status if the socket is initialized
  if (socket) {
    callback(socket.connected);
  }

  // Return a cleanup function to unregister this callback
  return () => {
    connectionStatusCallbacks = connectionStatusCallbacks.filter(cb => cb !== callback);
  };
};

// Notify all registered callbacks about connection status changes
const notifyConnectionStatus = (status: boolean) => {
  connectionStatusCallbacks.forEach(callback => callback(status));
};

// Initialize the socket connection
export const initializeSocket = () => {
  if (!socket) {
    console.log("Connecting to MasterServer via WebSocket...");
    socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      notifyConnectionStatus(true); // Notify all registered callbacks
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      notifyConnectionStatus(false); // Notify all registered callbacks
    });

    socket.on("connect_error", (err) => {
      console.log("WebSocket connection error:", err.message);
      notifyConnectionStatus(false); // Notify all registered callbacks
    });
  }
  return socket;
};


export const socketEvents = {
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
}

// Subscribe to control updates
export const subscribeToControlUpdates = (
  roomID: string,
  onControlUpdate: (updatedControl: any) => void
) => {
  if (!socket) {
    throw new Error("Socket not initialized. Call `initializeSocket` first.");
  }

  socket.emit("joinRoom", roomID);

  socket.on("controlUpdate", (updatedControl) => {
    console.log("Control updated:", updatedControl);
    onControlUpdate(updatedControl);
  });
};

// Leave the room and clean up
export const leaveRoom = (roomID: string) => {
  if (socket) {
    socket.emit("leaveRoom", roomID);
    console.log(`Left room: ${roomID}`);
  }
};

// Disconnect the socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// RESTful API functions
export const getAvailableControls = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/controls`);
    return response.data; // Replace with the structure returned by your server
  } catch (error) {
    console.error("Error fetching available controls:", error);
    throw error;
  }
};

export const getRoomDetails = async (roomID: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/rooms/${roomID}`);
    return response.data; // Replace with the structure returned by your server
  } catch (error) {
    console.error(`Error fetching room details for ${roomID}:`, error);
    throw error;
  }
};

export const updateControlStatus = async (controlID: string, status: string) => {
  try {
    const response = await axios.patch(`${BASE_URL}/controls/${controlID}`, { status });
    return response.data; // Replace with the structure returned by your server
  } catch (error) {
    console.error(`Error updating status for control ${controlID}:`, error);
    throw error;
  }
};
