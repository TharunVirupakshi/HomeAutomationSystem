import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5, FontAwesome6, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { COLORS } from "@/constants";


interface Control {
  id: string;
  name: string;
  status?: string; // Optional since new controls may not have a status
  icon?: React.ReactNode;
}

type roomID = keyof typeof dummyData

interface RouteParams {
  roomID: roomID;
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



const ManageControlsPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { roomID } = route.params as RouteParams;

  const [controls, setControls] = useState<Control[]>()
  const [availableControls, setAvailableControls] = useState<Control[]>([]);

  // Fetch available controls from the Master Server
  useEffect(() => {
    async function fetchControls() {
      try {
        // Replace with your actual fetch logic
        // const response = await fetch("https://example.com/api/available-controls");
         // Dummy data for available controls
        const dummyAvailableControls: Control[] = [
            { id: "15", name: "Coffee Maker", status: "off" },
            { id: "16", name: "Vacuum Cleaner", status: "off" },
            { id: "17", name: "Smart Curtains", status: "off" },
            { id: "18", name: "Thermostat", status: "on" },
            { id: "19", name: "Washing Machine", status: "off" },
            { id: "20", name: "Humidifier", status: "off" },
            { id: "21", name: "Humidifier", status: "off" },
        ];
        const data: Control[] = dummyAvailableControls;
        setAvailableControls(data);
        if(dummyData.hasOwnProperty(roomID)){
            setControls(dummyData[roomID].controls)
        }
      } catch (error) {
        console.error("Error fetching available controls:", error);
      }
    }

    fetchControls();
  }, []);

  const renderExistingControl = ({ item }: { item: Control }) => (
    <View style={styles.controlCard}>
      <Text style={styles.controlName}>{item.name}</Text>
      <Text style={styles.controlStatus}>Device ID: device_1</Text>
    </View>
  );

  const renderAvailableControl = ({ item }: { item: Control }) => (
    <Pressable style={styles.controlCard} onPress={() => console.log(`Add ${item.name}`)}>
      <Text style={styles.controlName}>{item.name}</Text>
      <Text style={styles.controlStatus}>Device ID: device_1</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
        
        <Stack.Screen
        options={{
          headerShown: true,
          title: `Manage ${roomID} controls`,
          headerTitleStyle: {
            color: COLORS.text,
          },
          headerStyle: {
            backgroundColor: COLORS.background,
          }
        }}
      />
        <ScrollView>
      {/* <Text style={styles.header}>{roomID} - Manage Controls</Text> */}

      {/* Existing Controls Section */}
      <View>
        <Text style={styles.sectionTitle}>Existing Controls</Text>
        <FlatList
          data={controls}
          keyExtractor={(item) => item.id}
          renderItem={renderExistingControl}
          contentContainerStyle={styles.listContainer}
          nestedScrollEnabled
        />
      </View>

      {/* Add New Controls Section */}
      <View>
        <Text style={styles.sectionTitle}>Add New Controls</Text>
        <Text style={{color: COLORS.textLight, paddingVertical: 10}}>Available controls</Text>
        
        <FlatList
          data={availableControls}
          keyExtractor={(item) => item.id}
          renderItem={renderAvailableControl}
          contentContainerStyle={styles.listContainer}
          nestedScrollEnabled
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManageControlsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ccc",
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  controlCard: {
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  controlName: {
    fontSize: 14,
    color: "#fff",
  },
  controlStatus: {
    fontSize: 12,
    color: "#aaa",
  },
});
