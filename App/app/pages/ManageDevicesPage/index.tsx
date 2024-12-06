import React, { useCallback, useEffect, useState } from "react";
import { FlatList, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { initializeSocket, socketEvents } from "@/API/masterServer";
import WifiManager from 'react-native-wifi-reborn'


// Local storage
interface Device {
  id: string;
  name: string;
  controls: number[]; // Example: array of pin numbers
}

// In-memory 
interface DeviceStatus {
  [deviceId: string] : boolean
}

interface WifiEntry {
  SSID: string;
  BSSID: string;
  capabilities: string;
  frequency: number;
  level: number;
  timestamp: number;
}

const setDummyData = async() => {
  const devices : Device[] = [
    {
      id: "device_1",
      name: "Device 1",
      controls: [4, 18, 19]
    }
  ] 

  try {
    await AsyncStorage.setItem("devices", JSON.stringify(devices))
  } catch (error) {
    console.error("Failed to set dummy devices in AsyncStorage:", error); 
  }
}

setDummyData()

const socketMS = initializeSocket()

export default function ManageDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({})
  const [newDeviceName, setNewDeviceName] = useState("");
  const router = useRouter();

  const [wifiList, setWifiList] = useState<WifiEntry[]>([]);

  // Function to request permissions and scan WiFi networks
  const scanWifiNetworks = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location permission is required for WiFi connections",
            message: "This app needs location permission as this is required to scan for wifi networks.",
            buttonNegative: "DENY",
            buttonPositive: "ALLOW",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Location permission granted");
          const networks = await WifiManager.loadWifiList();
          setWifiList(networks);
          console.log(networks);
        } else {
          console.log("Location permission denied");
        }
      } else {
        // iOS will automatically ask for permission
        const networks = await WifiManager.loadWifiList();
        setWifiList(networks);
        console.log(networks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    scanWifiNetworks();
  }, []);



  // Load devices from local storage
  const loadDevices = async () => {
    try {
      const storedDevices = await AsyncStorage.getItem("devices");
      if (storedDevices) {
        setDevices(JSON.parse(storedDevices));
      }
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  };

  // Save devices to local storage
  const saveDevices = async (updatedDevices: Device[]) => {
    try {
      await AsyncStorage.setItem("devices", JSON.stringify(updatedDevices));
      setDevices(updatedDevices);
    } catch (error) {
      console.error("Failed to save devices:", error);
    }
  };

  // Add a new device
  const handleAddDevice = () => {
    if (!newDeviceName.trim()) {
      alert("Device name cannot be empty.");
      return;
    }

    const newDevice: Device = {
      id: `device_${devices.length + 1}`,
      name: newDeviceName.trim(),
      controls: [],
    };

    const updatedDevices = [...devices, newDevice];
    saveDevices(updatedDevices);
    setNewDeviceName("");
  };

  // Remove a device
  const handleRemoveDevice = (id: string) => {
    const updatedDevices = devices.filter((device) => device.id !== id);
    saveDevices(updatedDevices);
  };

  // Navigate to Device Details page
  const handleViewDevice = (device: Device) => {
    router.push({
      pathname: "/pages/ManageDevicesPage/[deviceId]",
      params: { deviceId: device.id },
    });
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useFocusEffect(
    useCallback(()=>{
      socketMS.on(socketEvents.DEVICE_INFO, (msg) => {
        const { device_id, status } = msg;
        console.log("Device HeartBeat: ", msg);
        setDeviceStatus(prev =>({
          ...prev,
          [device_id] : status === 'ACTIVE' ? true : false
        }))
      })

      devices.forEach((device) => {
        socketMS.emit(socketEvents.GET_DEVICE_INFO, { id: device.id})
      })

      return () => {
        socketMS.off(socketEvents.DEVICE_INFO)
      }
    },[devices, socketMS])
  )

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Manage Devices",
          headerTitleStyle: { color: COLORS.text },
          headerStyle: { backgroundColor: COLORS.background },
        }}
      />

      {/* Add Device Section */}
      {/* <View style={styles.addDeviceContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter device name"
          value={newDeviceName}
          onChangeText={setNewDeviceName}
          placeholderTextColor="grey"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View> */}

      {/* Devices List */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleViewDevice(item)} style={styles.deviceItem}>
              <View>
                <Text style={styles.deviceTitle}>{item.name}</Text>
                <Text style={[styles.deviceInfoText, {color: deviceStatus[item.id] ? 'lightgreen' : COLORS.textLight}]}>{deviceStatus[item.id] ? "Online" : "Offline"}</Text>
              </View>
            </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No devices connected.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  addDeviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 8,
    color: COLORS.text,
    marginRight: 10,
  },
  addButton: {
    padding: 10,
    // backgroundColor: COLORS.secondary,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#3283d5",
    fontSize: FONTS.size.medium,
    fontFamily: FONTS.medium,
  },
  deviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    backgroundColor: COLORS.card
    // borderBottomWidth: 1,
    // borderBottomColor: "grey",
  },
  deviceTitle: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: FONTS.size.medium
  },
  deviceInfoText: {
    color: COLORS.textLight,
    fontFamily: FONTS.light,
    fontSize: FONTS.size.extraSmall 
  },
  removeText: {
    color: "red",
    fontFamily: FONTS.bold,
  },
  emptyText: {
    color: "grey",
    textAlign: "center",
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
});
