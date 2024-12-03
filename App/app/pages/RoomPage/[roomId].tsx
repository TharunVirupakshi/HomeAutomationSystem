
import React from "react";
import { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, Text, View, StyleSheet, Animated, Image, TouchableOpacity, FlatList, Alert} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import {COLORS, FONTS} from '../../../constants';
import { CardWithIcon, ControlCard, PopUpMenu, PressableBtn, PressableWithOpacity } from "@/components";
import { router, Stack, useFocusEffect } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useSearchParams } from "expo-router/build/hooks";
import { Property } from "@babel/types";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { initializeSocket, onConnectionStatusChange, socketEvents } from "@/API/masterServer";
import { Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";





interface RoomRouteParams {
  roomName: string;
  controls: Array<{ id: number; name: string }>;
}

interface RoomProps {
  route: {
    params: RoomRouteParams;
  };
}


interface Control {
  id: string;
  name: string;
  status: string; // 'on' or 'off'
  icon?: React.ReactNode;
  device_id: string
}

type Room  = {
  id: string;
  name: string;
  controls: Control[];
  hide?: boolean;
  icon?: React.ReactNode
}

interface renderControlCardProps{
  item: Control
}


const dummyData = {
  "Kitchen": {
    controls: [
      { id: "1", name: "Oven", status: "off" , icon: <MaterialCommunityIcons name="toaster-oven" size={35} color="white" />},
      { id: "2", name: "Refrigerator Light", status: "on" , icon: <MaterialIcons name="kitchen" size={35} color="white" />},
      { id: "3", name: "Dishwasher", status: "off", icon: <MaterialCommunityIcons name="dishwasher" size={35} color="white" /> },
      { id: "4", name: "Microwave", status: "off", icon: <MaterialCommunityIcons name="toaster-oven" size={35} color="white" /> },
    ]
  },
  "Bathroom": {
    controls: [
      { id: "5", name: "Shower Light", status: "on", icon: <MaterialIcons name="shower" size={35} color="white" /> },
      { id: "6", name: "Exhaust Fan", status: "off", icon: <FontAwesome6 name="fan" size={30} color="white" /> },
      { id: "7", name: "Heated Mirror", status: "on", icon: <MaterialCommunityIcons name="mirror" size={35} color="white" /> },
    ],
  },
  "Living Room": {
    controls: [
      // { id: "8", name: "TV", status: "off", icon: <FontAwesome6 name="tv" size={25} color="white" /> },
      // { id: "9", name: "AC", status: "on", icon: <FontAwesome5 name="snowflake" size={28} color="white" /> },
      { id: "4", name: "Ceiling Light", status: "off", device_id: "device_1",  icon: <FontAwesome5 name="lightbulb" size={28} color="white" /> },
      { id: "18", name: "Table Lamp", status: "off", device_id: "device_1", icon: <MaterialCommunityIcons name="lamp-outline" size={35} color="white" /> },
      { id: "19", name: "Table Lamp 2", status: "off", device_id: "device_1", icon:<MaterialCommunityIcons name="lamp-outline" size={35} color="white" />  },
      // { id: "11", name: "Table Lamp", status: "on", icon: <MaterialCommunityIcons name="lamp-outline" size={35} color="white" /> },
    ],
  },
  "Bedroom": {
    controls: [
      { id: "12", name: "Bedside Lamp", status: "on", icon: <MaterialCommunityIcons name="lamp-outline" size={35} color="white" /> },
      { id: "13", name: "Ceiling Fan", status: "off", icon: <MaterialCommunityIcons name="ceiling-fan" size={35} color="white" /> },
      { id: "14", name: "Smart Speaker", status: "on", icon: <MaterialCommunityIcons name="speaker" size={35} color="white" /> },
    ],
  },
};

type RoomName = keyof typeof dummyData;

const socketMS = initializeSocket();

export default function Room() {
  const { roomId } = useLocalSearchParams<{roomId: string}>();
  const [room, setRoom] = useState<Room | null>(null)

  // const [socketMS, setSocketMS] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

   // Define the callback for connection status updates
  const handleConnectionStatusChange = useCallback((status: boolean) => {
    console.log('web socket connection status changed')
    setIsConnected(status);
  }, []);

  useEffect(()=>{
    // const socket_instance = initializeSocket();
    // setSocketMS(socket_instance);
    onConnectionStatusChange(handleConnectionStatusChange);
    // Register the callback for connection status changes
    return () => {
      onConnectionStatusChange(()=>{})
    }; 
  }, []);
  
  const [controls, setControls ] = useState<Control[]>([])
  const [devices, setDevices] = useState<{[key: string]: {status: string}}>({}); // Store devices by ID

   // Utility function to load room by ID
  const loadRoomById = async (roomId: string) => {
    try {
      const storedRooms = await AsyncStorage.getItem("rooms");
      if (storedRooms) {
        const rooms = JSON.parse(storedRooms);
        return rooms.find((r: { id: string }) => r.id === roomId) || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to load the room:", error);
      return null;
    }
  };
  
  useEffect(()=>{
    const fetch =async() => {
      const roomData = await loadRoomById(roomId);
      if(roomData){
        setRoom(roomData)
      }
    }
    fetch()
  }, [roomId])

  useEffect(()=>{
    setControls(room?.controls || [])
  }, [room])

  useEffect(()=>{
    const device_data: any = {}  
    room?.controls.forEach(item => { device_data[item.device_id] = false})

    setDevices(device_data);
  },[room])

  // Initialize WebSockets
  useFocusEffect(
    useCallback(() => {
     
      // Listen for DEVICE_INFO events
      socketMS.on(socketEvents.DEVICE_INFO, (data) => {
        const { device_id, status } = data;
        console.log("Device HeartBeat: ", data);
        setDevices((prevDevices) => ({
          ...prevDevices,
          [device_id]: { status },
        }));
      });
      
       // Subscribe to devices
      Object.keys(devices).forEach((val, index) => socketMS.emit(socketEvents.GET_DEVICE_INFO, { id: index }))
        

      return () => {
        socketMS.off(socketEvents.DEVICE_INFO);
      };
    }, [socketMS])
  );
  
  const updateControls = (id: string, status: string) => {
    console.log("Updating controls...")
    setControls((prevControls) => {
      // Create a shallow copy of the controls array
      const updatedControls = [...prevControls];
      const index = updatedControls.findIndex((item) => item.id === id);

      if (index !== -1) {
        // Update the status of the matching control
        updatedControls[index] = {
          ...updatedControls[index],
          status: status
        };
      } else {
        console.warn(`Pin ${id} not found in controls.`);
      }

      return updatedControls;
    });
  }

  // Fetch and listen for real-time updates
useFocusEffect(
  useCallback(() => {
    const handlePinStatus = (msg: {
      device_id: string;
      pin_no: string;
      state: string;
    }) => {
      console.log("Pin status received:", msg);

      setControls((prevControls) => {
        // Create a shallow copy of the controls array
        const updatedControls = [...prevControls];
        const index = updatedControls.findIndex(
          (item) => item.id === msg.pin_no
        );

        if (index !== -1) {
          // Update the status of the matching control
          updatedControls[index] = {
            ...updatedControls[index],
            status: msg.state === "HIGH" ? "on" : "off",
          };
        } else {
          console.warn(`Pin ${msg.pin_no} not found in controls.`);
        }

        return updatedControls;
      });
    };

    // Attach socket listener
    socketMS.on(socketEvents.PIN_STATUS, handlePinStatus);

    // Request initial statuses for controls
   
      controls.forEach((control) => {
        socketMS.emit(socketEvents.GET_PIN_STATUS, {
          id: control.device_id,
          pin_no: control.id,
        });
      });
    

    // Cleanup listener on unmount
    return () => {
      socketMS.off(socketEvents.PIN_STATUS, handlePinStatus);
    };
  }, [roomId])
);

  function handleControlPin(item: Control): void {
    const deviceId = item.device_id;

    if(!isConnected){
      Alert.alert(
        'Master Server Offline',
        `The Master Server seems to be offline.`,
        [{ text: 'OK' }]
      );
      return; 
    }

    // Check if deviceId is defined
    if (!deviceId || !devices.hasOwnProperty(deviceId) || devices[deviceId].status === 'OFFLINE') {
      Alert.alert(
        'Device Offline',
        `The device with ID ${deviceId || 'unknown'} seems to be offline.`,
        [{ text: 'OK' }]
      );
      return;
    }
    socketMS.emit(socketEvents.CONTROL_DEVICE, {
      id: item.device_id,
      pin_no: item.id,
      state: item.status === 'on' ? "LOW" : "HIGH"
    })
  }

  const getDeviceStatus = (id: any) : string  => {
    if(devices.hasOwnProperty(id))
      return devices[id].status
    else
      return "OFFLINE"
  }

  const renderControlCard = ({ item } : renderControlCardProps) => (
      <TouchableOpacity style={styles.roomCard}>
      <ControlCard
        title={item.name}
        subtitle={item.status}
        icon={item.icon}
        status={item.status === "on" ? "on" : "off"}
        onPowerBtnPress={() => handleControlPin(item)}
        deviceStatus={getDeviceStatus(item.device_id)}
      />
      </TouchableOpacity>
    
  );

  //Modal state
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const toggleMenu = () => setIsMenuVisible(!isMenuVisible) 


  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingTop: 10,
      }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: room?.name,
          headerTitleStyle: {
            color: COLORS.text,
          },
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerRight: () => (
            <Pressable
              onPressIn={toggleMenu}
              hitSlop={20}
            >
              <Entypo
                name="dots-three-horizontal"
                size={18}
                color={COLORS.text}
              />
            </Pressable>
          ),
        }}
      />

      <PopUpMenu
        isMenuVisible={isMenuVisible}
        toggleMenu={toggleMenu}
        menuOptions={[
          {
            label: "Manage controls",
            onPress: () => {
              router.push({
                pathname: '/pages/ManageControlsPage/[roomID]',
                params: { roomID: roomId }
              })
            }
          },
          {
            label: "Rearrange controls",
            onPress: () => {}
          }
        ]}
      />

      <View style={styles.container}>
        {/* FlashList for displaying controls */}
        <FlatList
          data={controls}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderControlCard}
        />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  columnWrapper: {
    // justifyContent: "space-between", // Space out items in each row
    gap: 10
    // marginBottom: 5, // Space between rows
  },
  gridContainer: {
    gap: 10,
    // borderWidth: 0.5,
    // borderColor: 'white'
  },
  roomCard: {
    flex: 1, // Ensure even spacing
    // marginHorizontal: 5,
    // borderWidth: 0.5,
    // borderColor: 'white',
    display: "flex",
    flexDirection: "row",
    height: 110
    // alignItems: "center"
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // paddingHorizontal: 16,
  },
  customHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    // backgroundColor: "grey",
    width: "100%",
    paddingVertical: 15
  },
  headerText: {
    fontSize: FONTS.size.large,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    // textAlign: "center",
  },
  headerBottomBorder: {
    width: "100%",
    height: 2,
    backgroundColor: "white",
    // marginTop: 10,
  },
  logo: {
    width: 30,
    height: 30,
    objectFit: "contain"
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: COLORS.secondary,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});


