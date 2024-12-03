import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { initializeSocket, socketEvents } from "@/API/masterServer";
import { useRoute } from "@react-navigation/native";

interface Device {
  id: string;
  name: string;
  controls: number[]; // Array of pin numbers
}

interface RouteParams {
    deviceId: string
}

const socketMS = initializeSocket()

export default function DeviceDetailsPage() {
    const route = useRoute();
  const { deviceId } = route.params as RouteParams;
  const [device, setDevice] = useState<Device | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<boolean>(false)
  const [pinStatuses, setPinStatuses] = useState<{ [pin: number]: string }>({}); // Pin statuses

  // Load device info from AsyncStorage
  const loadDevice = async () => {
    try {
      const storedDevices = await AsyncStorage.getItem("devices");
      if (storedDevices) {
        const parsedDevices = JSON.parse(storedDevices) as Device[];
        const foundDevice = parsedDevices.find((d) => d.id === deviceId);
        if (foundDevice) setDevice(foundDevice);
      }
    } catch (error) {
      console.error("Failed to load device:", error);
    }
  };


  useFocusEffect(
    useCallback(() => {
      socketMS.on(socketEvents.DEVICE_INFO, (msg) => {
        const { device_id, status } = msg;
        console.log("Device HeartBeat: ", msg);
        setDeviceStatus(status === "ACTIVE" ? true : false);
      });

      socketMS.emit(socketEvents.GET_DEVICE_INFO, { id: device?.id });

      return () => {
        socketMS.off(socketEvents.DEVICE_INFO);
      };
    }, [device, socketMS])
  );

  // Listen to pin status updates
  useEffect(() => {
    const handlePinStatus = (data: { device_id: string; pin_no: number; state: string }) => {
      if (data.device_id === deviceId) {
        setPinStatuses((prev) => ({
          ...prev,
          [data.pin_no]: data.state === "HIGH" ? "On" : "Off",
        }));
      }
    };

    // Attach socket listener
    socketMS.on(socketEvents.PIN_STATUS, handlePinStatus);

    // Emit initial requests for pin statuses
    if (device?.controls) {
      device.controls.forEach((pin) => {
        socketMS.emit(socketEvents.GET_PIN_STATUS, { id: deviceId, pin_no: pin });
      });
    }

    // Cleanup listener on unmount
    return () => {
      socketMS.off(socketEvents.PIN_STATUS, handlePinStatus);
    };
  }, [deviceId, device]);

  useEffect(() => {
    loadDevice();
  }, [deviceId]);

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Device not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: device.name,
          headerTitleStyle: { color: COLORS.text },
          headerStyle: { backgroundColor: COLORS.background },
        }}
      />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={[styles.deviceId, {color: deviceStatus ? 'lightgreen' : COLORS.textLight}]}>{deviceStatus ? 'Online' : 'Offline'}</Text>
        <Text style={styles.deviceId}>ID: {device.id}</Text>
      </View>

      <Text style={styles.sectionTitle}>Controls</Text>
      <FlatList
        data={device.controls}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item: pin }) => (
          <View style={styles.pinItem}>
            <Text style={styles.pinText}>Pin {pin}</Text>
            <Text style={styles.statusText}>
              Status: {pinStatuses[pin] || "Unknown"}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No pins available for this device.</Text>}
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
  deviceInfo: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 8
  },
  deviceName: {
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: FONTS.size.large,
    marginBottom: 5,
  },
  deviceId: {
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
    fontSize: FONTS.size.small,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: FONTS.size.medium,
    marginVertical: 10,
  },
  pinItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    marginBottom: 10,
  },
  pinText: {

    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: FONTS.size.small,
  },
  statusText: {
    color: "grey",
    fontFamily: FONTS.light,
    fontSize: FONTS.size.extraSmall,
  },
  emptyText: {
    color: "grey",
    textAlign: "center",
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: FONTS.size.medium,
  },
});
