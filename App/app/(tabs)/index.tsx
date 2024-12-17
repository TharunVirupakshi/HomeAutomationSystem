
import React, { useContext } from "react";
import { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, Text, View, StyleSheet, Animated, Image, TouchableOpacity, FlatList, Modal} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import {COLORS, FONTS} from '../../constants';
import { CardWithIcon, PopUpMenu, PressableBtn, PressableWithOpacity } from "@/components";
import { Link, router, Stack, useFocusEffect } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
// import { initializeSocket, onConnectionStatusChange } from "@/API/masterServer";
import { Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { isObjectMethod } from "@babel/types";
import { SocketContextType, useSocket } from "@/contexts/socketContext";




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
  controls?: Control[];
  hide?: boolean;
  icon?: React.ReactNode
}
interface renderRoomCardProps{
  item: Room 
}

const dummyRooms = [
  {
    id: "1",
    name: "Living Room",
    controls: [
      { id: "4", name: "Ceiling Light", status: "off", device_id: "device_1",  icon: <FontAwesome5 name="lightbulb" size={28} color="white" /> },
      { id: "18", name: "Table Lamp", status: "off", device_id: "device_1", icon: <MaterialCommunityIcons name="lamp-outline" size={35} color="white" /> },
      { id: "19", name: "Table Lamp 2", status: "off", device_id: "device_1", icon:<MaterialCommunityIcons name="lamp-outline" size={35} color="white" />  }
    ],
    icon: <FontAwesome5 name="home" size={24} color="white" />
  },
  {
    id: "2",
    name: "Kitchen",
    controls: [
      { id: "1", name: "Oven", status: "off" , icon: <MaterialCommunityIcons name="toaster-oven" size={35} color="white" />},
      { id: "2", name: "Refrigerator Light", status: "on" , icon: <MaterialIcons name="kitchen" size={35} color="white" />},
      { id: "3", name: "Dishwasher", status: "off", icon: <MaterialCommunityIcons name="dishwasher" size={35} color="white" /> },
      { id: "4", name: "Microwave", status: "off", icon: <MaterialCommunityIcons name="toaster-oven" size={35} color="white" /> },
    ],
    icon: <FontAwesome6 name="kitchen-set" size={24} color="white" />
  },
  {
    id: "3",
    name: "Bedroom",
    controls: [
      { id: "12", name: "Bedside Lamp", status: "on", icon: <MaterialCommunityIcons name="lamp-outline" size={35} color="white" /> },
      { id: "13", name: "Ceiling Fan", status: "off", icon: <MaterialCommunityIcons name="ceiling-fan" size={35} color="white" /> },
      { id: "14", name: "Smart Speaker", status: "on", icon: <MaterialCommunityIcons name="speaker" size={35} color="white" /> },
    ],
    icon: <FontAwesome5 name="bed" size={24} color="white" />
  },
  {
    id: "4",
    name: "Bathroom",
    controls: [
      { id: "5", name: "Shower Light", status: "on", icon: <MaterialIcons name="shower" size={35} color="white" /> },
      { id: "6", name: "Exhaust Fan", status: "off", icon: <FontAwesome6 name="fan" size={30} color="white" /> },
      { id: "7", name: "Heated Mirror", status: "on", icon: <MaterialCommunityIcons name="mirror" size={35} color="white" /> },
    ],
    icon: <FontAwesome6 name="bath" size={24} color="white" />
  },
];

const dummyRoomsPlain = [
  {
    id: "1",
    name: "Living Room",
    controls: [
      { id: "4", name: "Ceiling Light", status: "off", device_id: "device_1"},
      { id: "18", name: "Table Lamp", status: "off", device_id: "device_1"},
      { id: "19", name: "Table Lamp 2", status: "off", device_id: "device_1"}
    ]
  },
  {
    id: "2",
    name: "Kitchen",
    controls: [
      { id: "4", name: "Oven", status: "off", device_id: "device_1"},
      { id: "2", name: "Refrigerator Light", status: "on", device_id: "device_2"},
      { id: "1", name: "Microwave", status: "off", device_id: "device_2" },
    ],
  }
];


const saveDummyData = async() => {
  try {
    const data = dummyRoomsPlain.map(item => (item))
    console.log("Dummy Rooms",JSON.stringify(data))
    await AsyncStorage.setItem("rooms", JSON.stringify(data))
    const storedData = await AsyncStorage.getItem("rooms");
    if(storedData) console.log("Stored Data: ",storedData)
  } catch (error) {
    console.error("Failed to save dummy rooms:", error);
  }
}
// Run only once when required
// saveDummyData(); 





export default function Index() {

  const { socket, source, initializeSocket, isCloudConnected, isLocalConnected } = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  // const isConnected = false

  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(()=>{
    console.log(`[Homepage] Webscocket (${source}): ${socket?.connected ? 'CONNECTED' : 'DISCONNECTED'}`)
    setIsConnected(isCloudConnected || isLocalConnected);
  }, [socket, source, isCloudConnected, isLocalConnected])

  // Define the callback for connection status updates
  // const handleConnectionStatusChange = useCallback((status: boolean) => {
  //   console.log("WebSocket connection status changed:", status);
  //   setIsConnected(status);
  // }, []);

  // useEffect(() => {
  //   // Register the callback
  //   const unregisterCallback = onConnectionStatusChange(handleConnectionStatusChange);

  //   // Cleanup: Unregister this callback on unmount
  //   return () => {
  //     unregisterCallback();
  //   };
  // }, [handleConnectionStatusChange]);


  
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isHeaderMenuVisible, setIsHeaderMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!isMenuVisible);
  const toggleHeaderMenu = () => setIsHeaderMenuVisible(!isHeaderMenuVisible);

   // Load rooms from AsyncStorage
   const loadRooms = async () => {
    try {
      const storedRooms = await AsyncStorage.getItem("rooms");
      if (storedRooms) {
        setRooms(JSON.parse(storedRooms));
      }
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };
  useFocusEffect(
    useCallback(()=>{
      loadRooms()
    },[])
  )
  
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
          headerTitle: () => <HeaderComponent isConnected={isConnected} isCloudOn={isCloudConnected} isLocalOn={isLocalConnected} source={source} onMenuPress={toggleHeaderMenu}/>,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      />

      <CardWithIcon
        btnText="Get Started"
        title="Hi, Paul"
        subtitle="Let's get started with the setup."
        icon={<FontAwesome5 name="lightbulb" size={40} color="white" />}
      />

      {/* Rooms Section */}
      <View style={{ paddingVertical: 15 }}>
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderTitle}>My Rooms</Text>

          <Pressable onPress={toggleMenu} hitSlop={15}>
            <Entypo name="dots-three-horizontal" size={18} color="white" />
          </Pressable>
        </View>

        {/* Popup Menu for MyRooms*/}
        <PopUpMenu
          isMenuVisible={isMenuVisible}
          toggleMenu={toggleMenu}
          menuOptions={[
            {
              label: "Manage rooms",
              onPress: () => {
                router.push('/pages/ManageRoomsPage')
              }
            },
            {
              label: "Rerrange rooms",
              onPress: () => {}
            }
          ]}
        />
        {/* Popup Menu for header */}
        <PopUpMenu
          isMenuVisible={isHeaderMenuVisible}
          toggleMenu={toggleHeaderMenu}
          menuOptions={[
            {
              label: `Switch to Local Server`,
              onPress: () => {
                initializeSocket('local')
              }
            },
            {
              label: `Switch to Cloud Server`,
              onPress: () => {
                initializeSocket('cloud')
              }
            }
          ]}
        />


        <FlatList
          data={rooms}
          renderItem={renderRoomCard}
          keyExtractor={(item) => item.id}
          numColumns={2} // Two columns
          columnWrapperStyle={styles.columnWrapper} // Style for columns
          contentContainerStyle={styles.roomsList}
          style={{
            paddingTop: 5,
          }}
        />
      </View>
    </SafeAreaView>
  );
}
const HeaderComponent = ({isConnected, source, onMenuPress, isCloudOn, isLocalOn} : {isConnected: boolean, isCloudOn:boolean, isLocalOn: boolean, source: string, onMenuPress: ()=> void}) => {
  return (
    <View style={styles.customHeader}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          // borderStyle: "solid",
          // borderWidth: 0.5,
          // borderColor: "white",
        }}
      >
        <View style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          // borderWidth: 0.5,
          // borderColor: "white",
          height: "100%"
        }}>
        <Image
          source={require("../../assets/images/app-adaptive-icon-white.png")} // Replace with your logo path
          style={styles.logo}
        />
        <View style={{
          height: '100%',
          width: 0.5,
          backgroundColor: "grey",
          marginHorizontal: 15
        }}/>
        <PressableWithOpacity>
          <View style={{flexDirection: "row", alignItems: "center"}}>
            <Text style={{
              // flex: 1,
              includeFontPadding: false,
              fontSize: FONTS.size.large,
              fontFamily: FONTS.medium,
              color: COLORS.text,
              // borderColor: "white",
              borderWidth: 0.5,
              // marginRight: 5
            }} 
            numberOfLines={1}
            ellipsizeMode='middle'
            >My Home</Text>
          <Entypo name="dot-single" size={30} color={isConnected ? isCloudOn ? COLORS.textBlue : 'lightgreen' : 'grey'} />
        </View>
      </PressableWithOpacity>
      </View>
      <View style={{
        flexDirection: "row",
        // borderStyle: "solid",
        // borderWidth: 0.5,
        // borderColor: "white", 
      }}>
{/* 
        <PressableWithOpacity>
          <Ionicons name="notifications" size={20} color="white" />
        </PressableWithOpacity> */}
        <PressableWithOpacity onPressIn={onMenuPress}>
          <Feather name="menu" size={20} color="white" style={{marginLeft: 15}}/>
        </PressableWithOpacity>
      </View>
      </View>
    </View>
  );
};


const renderRoomCard = ({ item } : renderRoomCardProps) => (
  <View style={styles.roomCard}>
    
    <PressableWithOpacity onPress={()=>{
      router.push({
        pathname: '/pages/RoomPage/[roomId]',
        params: { roomId: item.id }
      })
    }}>
    <CardWithIcon
      title={item.name}
      subtitle={`${item.controls ? (item.controls).length : 0} controls`}
      // icon={item.icon}
      customStyles={{
        titleStyle:{
          fontSize: FONTS.size.medium
        }
      }}
    />
  </PressableWithOpacity>
  </View>
);

const styles = StyleSheet.create({

  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    // borderColor: "white",
    // borderWidth: 0.5,
    width: "100%"
  },
  sectionHeaderTitle:{
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: FONTS.size.medium,
    padding: 2,
    borderWidth: 0.5,
    includeFontPadding: false
    // paddingVertical: 5
  },
  customHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    // backgroundColor: "grey",
    width: "100%",
    paddingVertical: 15
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    // borderColor: "white",
    // borderWidth: 0.5,
    height: '100%'
  },
  popupMenu: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    // borderColor: "grey",
    // borderWidth: 0.5,
    margin: 10
  },
  menuItem: {
    paddingVertical: 10,
    
  },
  menuItemText: {
    // includeFontPadding: false,
    fontFamily: FONTS.regular,
    fontSize: FONTS.size.medium,
    color: COLORS.text,
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
  roomCard: {
    flex: 1, // Ensure even spacing
    // marginHorizontal: 5,
  },
  columnWrapper: {
    justifyContent: "space-between", // Space out items in each row
    gap: 10
    // marginBottom: 5, // Space between rows
  },
  roomsList: {
    gap: 10, // Space between rows
    
  },
});