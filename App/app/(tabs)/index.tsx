
import React from "react";
import { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, Text, View, StyleSheet, Animated, Image, TouchableOpacity, FlatList, Modal} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import {COLORS, FONTS} from '../../constants';
import { CardWithIcon, PopUpMenu, PressableBtn, PressableWithOpacity } from "@/components";
import { Link, router, Stack } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { initializeSocket, onConnectionStatusChange } from "@/API/masterServer";
import { Socket } from "socket.io-client";





type item = {
  id: string,
  name: string,
  controlsCount: number,
  icon?: React.ReactNode
} 

interface renderRoomCardProps{
  item: item  
}

const dummyRooms = [
  {
    id: "1",
    name: "Living Room",
    controlsCount: 5,
    icon: <FontAwesome5 name="home" size={24} color="white" />
  },
  {
    id: "2",
    name: "Kitchen",
    controlsCount: 3,
    icon: <FontAwesome6 name="kitchen-set" size={24} color="white" />
  },
  {
    id: "3",
    name: "Bedroom",
    controlsCount: 4,
    icon: <FontAwesome5 name="bed" size={24} color="white" />
  },
  {
    id: "4",
    name: "Bathroom",
    controlsCount: 2,
    icon: <FontAwesome6 name="bath" size={24} color="white" />
  },
];

const socketMS = initializeSocket()

export default function Index() {

  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Define the callback for connection status updates
  const handleConnectionStatusChange = useCallback((status: boolean) => {
    console.log("WebSocket connection status changed:", status);
    setIsConnected(status);
  }, []);

  useEffect(() => {
    // Register the callback
    const unregisterCallback = onConnectionStatusChange(handleConnectionStatusChange);

    // Initialize the socket connection
    initializeSocket();

    // Cleanup: Unregister this callback on unmount
    return () => {
      unregisterCallback();
    };
  }, [handleConnectionStatusChange]);


  
  const [isMenuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!isMenuVisible);

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
          headerTitle: () => <HeaderComponent isConnected={isConnected}/>,
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

        {/* Popup Menu */}
        <PopUpMenu
          isMenuVisible={isMenuVisible}
          toggleMenu={toggleMenu}
          menuOptions={[
            {
              label: "Manage rooms",
              onPress: () => {}
            },
            {
              label: "Rerrange rooms",
              onPress: () => {}
            }
          ]}
        />

        {/* <Modal
          visible={isMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={toggleMenu}
          style={{
            // borderColor: "white",
            // borderWidth: 0.5,
            backgroundColor: 'transparent'
          }}
        >
          <Pressable
            style={styles.overlay}
            onPress={toggleMenu} // Close menu when overlay is clicked
          >
            <View style={styles.popupMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Option 1 clicked')}>
                <Text style={styles.menuItemText}>Manage rooms</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Option 2 clicked')}>
                <Text style={styles.menuItemText}>Rearrange</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal> */}

        <FlatList
          data={dummyRooms}
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
const HeaderComponent = ({isConnected} : {isConnected: boolean}) => {
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
              // borderWidth: 0.5,
              // marginRight: 5
            }} 
            numberOfLines={1}
            ellipsizeMode='middle'
            >My Home</Text>
          <Entypo name="dot-single" size={30} color={isConnected ? 'lightgreen' : 'grey'} />
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
        <PressableWithOpacity>
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
        pathname: '/RoomPage/[roomName]',
        params: { roomName: item.name }
      })
    }}>
    <CardWithIcon
      title={item.name}
      subtitle={`${item.controlsCount} controls`}
      icon={item.icon}
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