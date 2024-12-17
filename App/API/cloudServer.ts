import { io, Socket } from "socket.io-client";


const hostIp = "192.168.43.74" 

const SOCKET_URL = `http://${hostIp}:3000`;
const CLOUD_SOCKET_URL = `http://${hostIp}:5001`;


let socket: Socket | null = null;
let connectionStatusCallbacks: Array<(status: boolean) => void> = []; // Array to manage multiple callbacks

// Register a callback for connection status changes
export const onCloudConnectionStatusChange = (callback: (status: boolean) => void) => {
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
export const initializeCloudSocket = () => {
    if (!socket) {
      console.log("Connecting to MasterServer via CLOUD WebSocket...");
      socket = io(CLOUD_SOCKET_URL, { transports: ["websocket"] });
  
      socket.on("connect", () => {
        console.log("Connected to CLOUD WebSocket server");
        notifyConnectionStatus(true); // Notify all registered callbacks
        console.log("Establishing link to MasterServer via Cloud Tunnel")
        socket?.emit(cloudSocketEvents.CONNECT_TO_MASTER_SERVER, { masterServerId: '1'})
      });
  
      socket.on("disconnect", () => {
        console.log("Disconnected from CLOUD WebSocket server");
        notifyConnectionStatus(false); // Notify all registered callbacks
      });
  
      socket.on("connect_error", (err) => {
        console.log("CLOUD WebSocket connection error:", err.message);
        notifyConnectionStatus(false); // Notify all registered callbacks
      });
    }
    return socket;
  };

 export const cloudSocketEvents = {
    CONNECT_TO_MASTER_SERVER: "CONNECT_TO_MASTER_SERVER",
    TO_MASTER_SERVER: "TO_MASTER_SERVER"
  }