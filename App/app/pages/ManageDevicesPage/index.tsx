import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, PermissionsAndroid, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { initializeSocket, socketEvents } from "@/API/masterServer";
import WifiManager from 'react-native-wifi-reborn'
import axios from "axios";
import { useSocket } from "@/contexts/socketContext";


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

// setDummyData()

// const socketMS = initializeSocket()

export default function ManageDevicesPage() {

  const {socket, isCloudConnected, isLocalConnected, source, emitEvent} = useSocket();

  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({})
  const [newDeviceName, setNewDeviceName] = useState("");
  const router = useRouter();

  const [wifiList, setWifiList] = useState<WifiEntry[]>([]);

  // Function to request permissions and scan WiFi networks
  const scanWifiNetworks = async () => {
    console.log("Scanning networks...")
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
          const filteredNetworks = networks.filter(item => item.SSID.startsWith('ESP32'))
          console.log("Filtered networks: ", filteredNetworks)
          if(filteredNetworks.length > 0) setWifiList(filteredNetworks);
          networks.forEach(item => console.log(item.SSID))
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

  // useFocusEffect(
  //   useCallback(() => {
  //     scanWifiNetworks();
  //   }, [])
  // )

  useEffect(() => {
    scanWifiNetworks(); // Initial scan

    const interval = setInterval(async() => {
        await scanWifiNetworks();
    }, 10000); // Scan every 20 seconds

    return () => clearInterval(interval); // Cleanup the interval on component unmount
}, []);

  const connectToDevice = async (SSID : string, psswd : string) => {
    if (Platform.OS === 'android') {
      try {
        const isWifiEnabled = await WifiManager.isEnabled();
        if (!isWifiEnabled) {
          // Prompt user to enable WiFi
          Alert.alert(
            "WiFi Disabled",
            "Please enable WiFi to connect.",
            [
              { text: "OK", onPress: () => WifiManager.setEnabled(true) }
            ],
            { cancelable: false }
          );
          return false;
        }
        const result = await WifiManager.connectToProtectedSSID(SSID, psswd, false, false);
        // Get the current IP address from the connection info
        const connectionInfo = await WifiManager.getCurrentWifiSSID();
        console.log('Connected to:', connectionInfo);

        const device_info = await axios.get(`http://192.168.4.1/`);
        console.log('ESP32 Device info: ', device_info)
        
        Alert.alert("Connected", `Connected to ESP32. Details : ${JSON.stringify(device_info?.data)}`, 
        [
          { text: "OK", onPress: () => setIsModalOpen(true) }
        ],
        { cancelable: false });
        return true;
      } catch (e) {
        console.error(e);
        Alert.alert("Error", `${e}`);
        return false;
      }
    } else {
      // iOS specific code or general notification
      Alert.alert("Info", "Manual connection required on iOS");
    }
  };

  const connectDeviceToNetwork = async(ssid: string, password: string) => {

    try {
      // Send WiFi credentials to the ESP32
      const url = `http://192.168.4.1/connect?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(password)}`;
      const response = await axios.get(url);
      console.log('ESP32 response:', response.data);
      Alert.alert("Connected", `Credentials sent to ESP32. Details : ${JSON.stringify(response.data)}`, 
        [
          { text: "OK", onPress: () => setIsModalOpen(false) }
        ],
        { cancelable: false });
      return true;
    } catch (e) {
      console.error(e);
      Alert.alert("Error", `${e}`);
      return false; 
    } finally{
      setIsModalOpen(false)
    }
   
  }




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
      socket?.on(socketEvents.DEVICE_INFO, (msg) => {
        const { device_id, status } = msg;
        console.log("Device HeartBeat: ", msg);
        setDeviceStatus(prev =>({
          ...prev,
          [device_id] : status === 'ACTIVE' ? true : false
        }))
      })

      devices.forEach((device) => {
        emitEvent(socketEvents.GET_DEVICE_INFO, { id: device.id})
      })

      return () => {
        socket?.off(socketEvents.DEVICE_INFO)
      }
    },[devices, socket])
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [networkSSID, setNetworkSSID] = useState<string>('')
  const [networkPassword, setNetworkPassword] = useState<string>('')
  const [selectedDeviceSSID, setSelectedDeviceSSID] = useState<string>('')

  // useEffect(()=>setIsModalOpen(true), []) //To test

  const toggleModal = () => setIsModalOpen(prev => !prev)

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
      <View>
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
        ListHeaderComponent={() => <Text style={styles.header}>Paired Devices</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No devices connected.</Text>}
        stickyHeaderIndices={[0]}
      />
      </View>

      <View>
      <FlatList
        data={wifiList}
        keyExtractor={(item, index) => item.BSSID + index}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => connectToDevice(item.SSID, '123456789')}>
          <View style={styles.networkItem}>
            <Text style={styles.networkSSID}>{item.SSID}</Text>
            <Text style={styles.networkDetails}>Signal Strength: {item.level}dBm</Text>
          </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={() => <Text style={styles.header}>Available Networks</Text>}
        ListEmptyComponent={() => <Text style={{color: COLORS.textLight, textAlign: 'center', marginTop: 40}}>No devices found</Text>}
        stickyHeaderIndices={[0]}
      />
      </View>

      {/* Add Room Section */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={toggleModal}
        style={{ backgroundColor: "transparent" }}
      >
        <Pressable style={styles.overlay} onPress={toggleModal}>
        <View style={styles.modalContainer}>
          <Text style={{color: COLORS.text, paddingVertical: 20, fontFamily: FONTS.light}}>Connect your device to your network</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter SSID of your network"
            value={networkSSID}
            onChangeText={setNetworkSSID}
            placeholderTextColor="grey"
          />
          <TextInput
            style={styles.input}
            placeholder="Enter password of your network"
            value={networkPassword}
            onChangeText={setNetworkPassword}
            placeholderTextColor="grey"
            textContentType="password"
            secureTextEntry={true}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => connectDeviceToNetwork(networkSSID, networkPassword)}>
            <Text style={styles.addButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    // flex: 1,
    // height: 100,
    flexDirection: "column",
    // alignItems: "center",
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'black'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    // borderColor: "white",
    // borderWidth: 0.5,
    height: '100%'
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  networkItem: {
    // flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.card
  },
  networkSSID: {
    fontSize: FONTS.size.medium,
    fontFamily: FONTS.medium,
    color: COLORS.text
  },
  networkDetails: {
    fontSize: FONTS.size.small,
    fontFamily: FONTS.medium,
    color: COLORS.textLight 
  },
  header: {
    fontSize: FONTS.size.small,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    backgroundColor: COLORS.background, 
    paddingVertical: 20
  },
  addDeviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    // flex: 1,
    paddingHorizontal: 15,
    height: 40,
    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 8,
    color: COLORS.text,
    fontFamily: FONTS.extraLight,
    marginBottom: 10
    // marginRight: 10,
  },
  addButton: {
    padding: 10,
    // backgroundColor: COLORS.secondary,
    borderRadius: 8,
    width: "100%"
  },
  addButtonText: {
    color: "#3283d5",
    fontSize: FONTS.size.medium,
    fontFamily: FONTS.medium,
    textAlign: 'center'
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
