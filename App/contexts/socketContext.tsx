import { cloudSocketEvents } from '@/API/cloudServer';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { io, Socket } from "socket.io-client";

export interface SocketContextType {
  socket: Socket | null;
  isLocalConnected: boolean;
  isCloudConnected: boolean;
  source: string;
  initializeSocket: (startWith: 'local' | 'cloud') => void;
  emitEvent: (event: string, payload: Object) => void;
}

export interface cloudSocketMessage {
  masterServerId: string,
  event: string,
  payload: Object
}

const HOST_IP = "192.168.43.74";
// const SOCKET_URL = `http://${"192.168.43.73"}:3000`;
const SOCKET_URL = `http://${HOST_IP}:3000`;
const CLOUD_SOCKET_URL = `http://${HOST_IP}:5001`;

const SocketContext = createContext<SocketContextType | null  >(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children } : SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLocalConnected, setIsLocalConnected] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [source, setSource] = useState('');

  const connectToSocket = async(url: string, source: string) => {

      await disconnectSocket();
      setSource(source);

      const newSocket = io(url, { transports: ["websocket"] });
      
    
      newSocket.on("connect", () => {
        console.log(`Connected to ${source} at ${url}`);
        

        // Register on conncetion
        if(source === 'cloud'){
          console.log('Connecting to MasterServer via Cloud Tunnel')
          setIsCloudConnected(true);
          newSocket.emit(cloudSocketEvents.CONNECT_TO_MASTER_SERVER, { masterServerId: '1'})
        }else{
          setIsLocalConnected(true)
        }
        setSource(source);
      });
  
      newSocket.on("disconnect", () => {
        console.log(`Disconnected from WebSocket (${source}) server`);
        if(source === 'cloud') setIsCloudConnected(false);
        if(source === 'local') setIsLocalConnected(false);
  
      });
  
      newSocket.on("connect_error", (err) => {
        console.log(`WebSocket (${source}) connection error: ${err.message}`);
        // setIsConnected(false);
        // if (source === "local") {
        //   console.log("Attempting to connect to the cloud as a fallback...");
        //   connectToSocket(CLOUD_SOCKET_URL, "cloud");
        // }

        if(source === 'cloud') setIsCloudConnected(false);
        if(source === 'local') setIsLocalConnected(false);
      });
  
      setSocket(newSocket);
    
  }
  

  
  const disconnectSocket = () => {
    return new Promise<void>((resolve, reject) => {
      if (socket && socket.connected) {
        console.log("Disconnecting socket...");
  
        // Setup a timeout to handle cases where disconnect does not occur
        const timeout = setTimeout(() => {
          console.log("Timeout: Socket disconnect took too long.");
          socket.removeAllListeners(); // Cleanup listeners
          setSocket(null); // Ensure the socket is cleared
          resolve(); // Resolve anyway to not block further processes
        }, 5000); // Adjust timeout duration as appropriate
  
        // Listen for the disconnect event
        socket.on("disconnect", () => {
          clearTimeout(timeout); // Clear the timeout as disconnect occurred
          console.log("Socket disconnected.");
          socket.removeAllListeners(); // Cleanup listeners
          setSocket(null); // Clear the socket state
          resolve(); // Resolve the promise
        });
  
        socket.disconnect(); // Trigger the disconnect
        setIsCloudConnected(false);
        setIsLocalConnected(false);
      } else {
        console.log("Socket not connected or already disconnected.");
        setIsCloudConnected(false);
        setIsLocalConnected(false);
        resolve(); // Resolve immediately as there's nothing to disconnect
      }
    });
  };
  

  const initializeSocket = (startWith: 'local' | 'cloud' = 'local') => {
    const url = startWith === "local" ? SOCKET_URL : CLOUD_SOCKET_URL;

    connectToSocket(url, startWith);

  };


  // Emitter wrapper

  const emitEvent = (event: string, payload: Object) => {
    console.log(`Emitted ${source} event: ${event}`)
    if(source === "cloud"){
      const msg : cloudSocketMessage = {
        masterServerId: '1',
        event: event,
        payload: payload
      }

      socket?.emit(cloudSocketEvents.TO_MASTER_SERVER, msg);
    }else{
      socket?.emit(event, payload);
    }
  }

  

  // Clean up the socket connection when the component unmounts
  useEffect(() => {

    console.log("Init socket in useEffect [socketContext]")
    initializeSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up socket...');

        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, source, initializeSocket, emitEvent, isCloudConnected, isLocalConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
