
import React from "react";
import { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, Text, View, StyleSheet, Animated, Image, TouchableOpacity, FlatList} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import {COLORS, FONTS} from '../../constants';
import { CardWithIcon, ControlCard, PressableBtn, PressableWithOpacity } from "@/components";
import { Stack } from "expo-router";
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
      { id: "8", name: "TV", status: "off", icon: <FontAwesome6 name="tv" size={25} color="white" /> },
      { id: "9", name: "AC", status: "on", icon: <FontAwesome5 name="snowflake" size={28} color="white" /> },
      { id: "10", name: "Ceiling Light", status: "off", icon: <FontAwesome5 name="lightbulb" size={28} color="white" /> },
      { id: "11", name: "Table Lamp", status: "on", icon: <MaterialCommunityIcons name="lamp-outline" size={35} color="white" /> },
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

export default function Room() {
  const { roomName } = useLocalSearchParams<{roomName: RoomName}>();

  const [controls, setControls ] = useState<Control[]>([]);

  useEffect(()=>{
    
    if(dummyData.hasOwnProperty(roomName)){
      setControls(dummyData[roomName].controls)
    }
      
  },[roomName])

  const renderControlCard = ({ item } : renderControlCardProps) => (
      <TouchableOpacity style={styles.roomCard}>
      <ControlCard
        title={item.name}
        subtitle={item.status}
        icon={item.icon}
        btnStatus={item.status === "on" ? "on" : "off"}
      />
      </TouchableOpacity>
    
  );



  return (
    
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingTop: 10
      }}
    >
   
      <Stack.Screen 
        options={{
          headerShown: true,
          title: roomName,
          headerTitleStyle: {
            color: COLORS.text
          },
          headerStyle:{
            backgroundColor: COLORS.background
         }
        }}
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