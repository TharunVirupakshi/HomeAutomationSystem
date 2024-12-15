import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, FlatList, Alert, View, Modal, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { COLORS, FONTS } from "@/constants";

interface Control {
  id: string;
  name: string;
  status: string; // 'on' or 'off'
  icon?: React.ReactNode;
  device_id: string
}
interface Room {
  id: string;
  name: string;
  controls: Control[];
  hide?: boolean;
  icon?: React.ReactNode
}

export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [isAddRoomCardVisible, setIsAddRoomCardVisible] = useState<boolean>(false)

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

  // Save rooms to AsyncStorage
  const saveRooms = async (updatedRooms: Room[]) => {
    try {
      await AsyncStorage.setItem("rooms", JSON.stringify(updatedRooms));
      setRooms(updatedRooms);
    } catch (error) {
      console.error("Failed to save rooms:", error);
    }
  };

  // Add a new room
  const handleAddRoom = () => {
    if (!newRoomName.trim()) {
      Alert.alert("Invalid Name", "Room name cannot be empty.");
      return;
    }

    if (rooms.find((room) => room.name.toLowerCase() === newRoomName.trim().toLowerCase())) {
      Alert.alert("Duplicate Name", "A room with this name already exists.");
      return;
    }

    const newRoom: Room = {
      id: `${rooms.length + 1}`,
      name: newRoomName.trim(),
      controls: []
    };

    const updatedRooms = [...rooms, newRoom];
    saveRooms(updatedRooms);
    setNewRoomName("");
    toggleAddRoomCard()
  };

  // Remove a room
  const handleRemoveRoom = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this room?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedRooms = rooms.filter((room) => room.id !== id);
            saveRooms(updatedRooms);
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const toggleAddRoomCard = () => {
    setIsAddRoomCardVisible(prev => !prev)
  }


  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Manage Rooms",
          headerTitleStyle: { color: COLORS.text },
          headerStyle: { backgroundColor: COLORS.background },
        }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 10,
          width: "100%",
        }}
      >
        <Text style={styles.sectionTitle}>My Rooms</Text>

        <Pressable onPress={toggleAddRoomCard} hitSlop={20}>
    
          <Text
            style={{
              fontFamily: FONTS.light,
              color: COLORS.textBlue,
              includeFontPadding: false,
              fontSize: FONTS.size.extraLarge,
            }}
          >
            +
          </Text>
        </Pressable>
      </View>

      {/* Add Room Section */}
      <Modal
        visible={isAddRoomCardVisible}
        transparent
        animationType="fade"
        onRequestClose={toggleAddRoomCard}
        style={{ backgroundColor: "transparent" }}
      >
        <Pressable style={styles.overlay} onPress={toggleAddRoomCard}>
        <View style={styles.addRoomContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter room name"
            value={newRoomName}
            onChangeText={setNewRoomName}
            placeholderTextColor="grey"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddRoom}>
            <Text style={styles.addButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
        </Pressable>
      </Modal>

      {/* Rooms List */}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={()=>{
            router.push({
                pathname: '/pages/RoomPage/[roomId]',
                params: {
                    roomId: item.id 
                }
            })
          }}>
          <View style={styles.roomItem}>
            <Text style={styles.roomText}>{item.name}</Text>

            {/* Removing room is disabled just to avoid accidental deletion. */}
            <TouchableOpacity onPress={() => handleRemoveRoom(item.id)} disabled>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No rooms available.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontFamily: FONTS.light,
    fontSize: FONTS.size.medium
  },
  addRoomContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 15
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    // borderColor: "white",
    // borderWidth: 0.5,
    height: '100%'
  },
  input: {
    flex: 1,
    padding: 10,
    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 8,
    color: COLORS.text,
    marginRight: 10,
    fontFamily: FONTS.medium,
  },
  addButton: {
    padding: 10,
    // backgroundColor: COLORS.secondary,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.textBlue,
    fontFamily: FONTS.light,
  },
  roomItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    marginBottom: 10,
  },
  roomText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: FONTS.size.medium,
  },
  removeText: {
    color: "red",
    fontFamily: FONTS.light,
  },
  emptyText: {
    color: "grey",
    textAlign: "center",
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
});
