#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h> 

Preferences preferences;
WebServer server(80);
// Function to handle the root URL


// Replace with your Wi-Fi and MQTT broker details

// SSID and password for SoftAP
const char* softAP_ssid = "ESP32-SoftAP";
const char* softAP_password = "123456789";

const char* wifi_ssid= "";        // Your Wi-Fi SSID
const char* wifi_password = "";     // Your Wi-Fi password

// char* wifi_ssid = "Tharun'sGalaxy M32";        // Your Wi-Fi SSID
// char* wifi_password = "asdfghjkl";     // Your Wi-Fi password
const char* mqtt_server = "Tharuns-MacBook-Air.local"; // MQTT broker's IP or hostname
const int mqtt_port = 8883;                  // MQTTS port

// Wi-Fi and MQTT objects
WiFiClientSecure espClient; // Secure Wi-Fi client for MQTTS
PubSubClient client(espClient);

// MQTT credentials (if required)
const char* mqtt_user = "";
const char* mqtt_password = "";

// Device ID and topics
const char* device_id = "device_1";
char config_topic[50];
char device_info_topic[50];
// Publish response when a message is received on the topic
char device_info_response_topic[50];
const char* device_discovery_topic = "device-discovery";


void generateTopics(const char* device_id){
  snprintf(config_topic, sizeof(config_topic), "%s/config", device_id);
  snprintf(device_info_topic, sizeof(device_info_topic), "%s/info/get", device_id);
  snprintf(device_info_response_topic, sizeof(device_info_response_topic), "%s/info", device_id);
}

// Broker's certificate
const char* ca_cert = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUAvZEjQY3MIHwRnG+AjK9U5+hH4wwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNDExMjAwOTMyNTBaFw0zNDEx
MTgwOTMyNTBaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQCsDAA3R2o4Qh4mMhMUya3+o2ukxequbii/1fHmh2Ak
j7JyVxuDS4PE6A3U2Ov5PJhPDRkFrzSIYllGzOmJ707BO3aQd7VFR9z0eBWE5mRq
spD7pNYL8NISO4FF9Ly76iMr5ONXjHL30To0rXYfu+x+tJsN11RXgdi3TcrDWCi1
XypNJTFCsdnl7omLUTgJv6nE///UZJtqnUe2RHEGo4sr+WtsyY0FXqw6MsUhZkQ1
S/MR2BwTz/TGrNTr6DgAgHaUITjKSvnlvaIhPQquVtdpvQEUbPg5Wr7EE5iUICA3
ef7V0n7sh9aJMHiAOQeweZ22dw0C+9Ecclwby6Tvc6d5AgMBAAGjUzBRMB0GA1Ud
DgQWBBQNeQ26QD8XPxamUhRBLg6AwvgZbTAfBgNVHSMEGDAWgBQNeQ26QD8XPxam
UhRBLg6AwvgZbTAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCc
o2TWGzQv79SWaqGYWvQI1YzX1qFGCxF2SsM/1eT4Jt7Tr/4pQeZbR1YuuxYtH7PV
V2zevAoycTanDpfVgEImh2dxHByRoTdbdlV9fBx2+wT0LyJGVmkLwhGwgmaN/pFd
avG+j8EflcYZuHfPKmkEiGZd7FeE2586XWDWLuDBsWLh7uu2IjMxaqTWiTLfD2R4
MUdJU7B64NLVtEKFO+jmVXGw/eHgnQMz34HjcpItRjLo8Gv+ymIbzHuoMZkysDlQ
dh1zWTj//VUO0lv7P2XQU84VGEMG5BmS1Ql2H6uROeaIBQtylCXHSZNzciKXLMtH
lNbV75YVpfsvRSgyBgjK
-----END CERTIFICATE-----
)EOF";



// Use the device_id variable for topic subscriptions
void subscribeToTopics(const char* device_id) {
  String specific_pin_get_topic = String(device_id) + "/pin/+/get";
  String all_pins_get_topic = String(device_id) + "/pins/get";
  String specific_pin_set_topic = String(device_id) + "/pin/+/set";
  String device_info_topic = String(device_id) + "/info/get";
  String discovery_topic = "device-discovery/get";

  // Subscribe to the topics
  client.subscribe(specific_pin_get_topic.c_str());  // Specific pin status requests
  client.subscribe(all_pins_get_topic.c_str());     // All pins status requests
  client.subscribe(specific_pin_set_topic.c_str()); // Specific pin state changes
  client.subscribe(device_info_topic.c_str());      // Device info requests
  client.subscribe(discovery_topic.c_str());        // Device discovery
  client.subscribe(config_topic);                   // Config topic (assuming it's global)

  // Debugging - Confirm subscription
  Serial.printf("Subscribed to topic: %s\n", specific_pin_get_topic.c_str());
  Serial.printf("Subscribed to topic: %s\n", all_pins_get_topic.c_str());
  Serial.printf("Subscribed to topic: %s\n", specific_pin_set_topic.c_str());
  Serial.printf("Subscribed to topic: %s\n", device_info_topic.c_str());
  Serial.printf("Subscribed to topic: %s\n", discovery_topic.c_str());
  Serial.printf("Subscribed to topic: %s\n", config_topic);
}


// GPIO pin states
const int gpio_pins[] = {4, 18, 19}; // Example pins to configure/control
const int tot_pins = sizeof(gpio_pins) / sizeof(gpio_pins[0]);
int pin_states[tot_pins] = {0}; // Pin states

int get_pin_indx(int pin){
  switch(pin){
    case 4 : return 0;
    case 18 : return 1;
    case 19 : return 2;
    default : return -1;
  }
  return -1;
}

// MQTT Publish Pin State
void publishPinState(int pin) {
    int pin_index = get_pin_indx(pin);
    if(pin_index == -1){
      Serial.println("Invalid index into gpio_pins");
      return;
    }
    char topic[50];
    snprintf(topic, sizeof(topic), "%s/pin/%d/status", device_id, gpio_pins[pin_index]);
    client.publish(topic, pin_states[pin_index] ? "{ \"state\" : \"HIGH\" }" : "{ \"state\" : \"LOW\" }");
}

// Set Pin State and Publish
void setPinState(int pin, int state) {
  int pin_index = get_pin_indx(pin);
  if(pin_index == -1){
    Serial.println("Invalid index into gpio_pins");
    return;
  }
  if (pin_states[pin_index] != state) {
      pin_states[pin_index] = state;
      digitalWrite(gpio_pins[pin_index], state);
      publishPinState(pin);
  }
}

// Poll Pin States
void pollPinStates() {
    for (int i = 0; i < tot_pins; i++) {
        int current_state = digitalRead(gpio_pins[i]);
        if (current_state != pin_states[i]) {
            setPinState(gpio_pins[i], current_state);
        }
    }
}

void getPinStatus(int pin, const char* device_id) {
  publishPinState(pin);
}

void getAllPinsStatus(const char* device_id) {
  String response = "{";
  for (int pin = 0; pin < 3; pin++) {
    response += "\"pin" + String(gpio_pins[pin]) + "\":\"" + (digitalRead(gpio_pins[pin]) ? "HIGH" : "LOW") + "\",";
  }
  response.remove(response.length() - 1); // Remove trailing comma
  response += "}";
  String topic = String(device_id) + "/pins/status";
  client.publish(topic.c_str(), response.c_str());
  Serial.printf("Pusblished to: %s\n", topic);
}

void getDeviceInfo(){
  String device_info = "{ \"status\": \"ACTIVE\" }"; // Replace with actual info
  client.publish(device_info_response_topic, device_info.c_str());
  
}

void hanldeSetPinState(int pin, const char* state, const char* device_id) {
  String ack_topic = String(device_id) + "/pin/" + String(pin) + "/set/ack";
  
  if(get_pin_indx(pin) == -1){
    String error_message = "{ \"error\": \"Invalid pin\", \"pin\":" + String(pin)+ " }";
    client.publish(ack_topic.c_str(), error_message.c_str());
    return;
  }

  // Set pin state if it's configured as OUTPUT
  if (strcmp(state, "HIGH") == 0) {
    setPinState(pin, 1);
  } else if (strcmp(state, "LOW") == 0) {
    setPinState(pin, 0);
  } else {
    String error_message = "{ \"error\": \"Invalid state " + String(state) + "\", \"pin\":" + String(pin)+ " }";
    client.publish(ack_topic.c_str(), error_message.c_str());
    return;
  }

  // Send acknowledgment
  String ack_message = "{ \"success\": true, \"pin\":" + String(pin)+ " }";
  client.publish(ack_topic.c_str(), ack_message.c_str());
}


void pubToDeviceDiscovery(){
  String device_info = "{ \"device_id\": \"" + String(device_id) + "\", \"status\": \"ONLINE\" }"; 
  client.publish(device_discovery_topic, device_info.c_str());
}


// Callback for MQTT messages
void callback(char* topic, byte* payload, unsigned int length) {

  String topic_str = String(topic);

  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0'; // Null-terminate the payload

  Serial.print("Message: ");
  Serial.println(message);



  if (topic_str.endsWith("/pins/get")) { // Handle get all pins status
    getAllPinsStatus(device_id);
  }else if(topic_str.endsWith(("/info/get"))){
    getDeviceInfo();
  }else if (topic_str.equals("device-discovery/get")){
    pubToDeviceDiscovery();
  }else if (topic_str.endsWith("/get")) {
    int pin = topic_str.substring(topic_str.indexOf("pin/") + 4, topic_str.lastIndexOf("/get")).toInt();
    getPinStatus(pin, device_id);
  }else if (topic_str.endsWith("/set")) {
    int pin = topic_str.substring(topic_str.indexOf("pin/") + 4, topic_str.lastIndexOf("/set")).toInt();
    hanldeSetPinState(pin, message, device_id);
  }else if (strcmp(topic, config_topic) == 0) {
    
  }
}

// Reconnect to MQTT broker
void reconnect() {
  int retries = 0;
  while (!client.connected() && retries <= 15) {
    Serial.println("Attempting MQTTS connection...");

    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("Connected to MQTTS broker!");

      // Subscribe to relevant topics
      subscribeToTopics(device_id);

      // Publish initial status
      getDeviceInfo();
      getAllPinsStatus(device_id);
      pubToDeviceDiscovery();
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Trying again in 5 seconds...");
      delay(5000);
    }

    if(WiFi.status() != WL_CONNECTED) return; // EXIT
    retries++;
  }
}

// Configure MQTTS
void setupMQTT() {
   // Generate MQTT topics
  
  espClient.setCACert(ca_cert); // Load CA certificate
  // espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  generateTopics(device_id); 
  subscribeToTopics(device_id);
}

void connectToWiFi(const char* ssid, const char* password){
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 10) {
    delay(1000);
    Serial.print(".");
    retries++;
  }
}



void handleRoot() {
  const size_t capacity = JSON_OBJECT_SIZE(3) + 100;
  StaticJsonDocument<capacity> doc;

  // Fill the JSON document
  doc["message"] = "Send WiFi credentials with /connect?ssid=yourSSID&pass=yourPassword";
  doc["device_id"] = device_id; // Assuming 'device_id' is globally defined and is a string
  doc["mac_address"] = WiFi.macAddress(); // Gets the MAC address of the ESP's WiFi station
  doc["ip_address"] = WiFi.softAPIP();

  String jsonStr;
  serializeJson(doc, jsonStr); // Serialize the JSON document to a string

  server.send(200, "application/json", jsonStr); // Send the JSON string as a response
}


void handleConnect() {

  if (!preferences.begin("wifi", false)) {
    Serial.println("Failed to open preferences");
    server.send(500, "text/plain", "Server error: failed to open preferences.");
    return;
  }

  String ssid = server.arg("ssid");
  String password = server.arg("pass");


  Serial.print("Credentials received: ");
  Serial.printf("SSID: %s, Password: %s\n", ssid.c_str(), password.c_str());

  

  if (ssid.length() > 0 && password.length() > 0) {
    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.end(); // Close the Preferences after writing

    server.send(200, "text/plain", "Credentials saved. Restarting...");

    delay(1000);
    server.close();
    delay(1000);
    ESP.restart();
    // connectToWiFi(ssid.c_str(), password.c_str());
  } else {
    server.send(400, "text/plain", "Missing ssid or pass parameter.");
  }
}



void setupSoftAPMode(){
 
  WiFi.softAP(softAP_ssid, softAP_password); // Start SoftAP mode

  server.on("/", handleRoot);
  server.on("/connect", handleConnect);
  server.begin();
  Serial.print("Access at IP: ");
  Serial.println(WiFi.softAPIP());
}

void connectionSetup(){

  if (!preferences.begin("wifi", false)) {
    Serial.println("Failed to open preferences");
    return;
  }

  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");
  preferences.end(); // Close the Preferences after writing

 
    if(WiFi.status() == WL_CONNECTED){
      setupMQTT();
    }else{

      if (ssid != "" && password != "") connectToWiFi(ssid.c_str(), password.c_str());

      if(WiFi.status() != WL_CONNECTED){
        Serial.println("\nFailed to connect to Wi-Fi. Starting SoftAP mode");
        setupSoftAPMode(); 
      }
    }
} 

const int reconnectInterval = 5000; // Time between reconnect attempts in milliseconds
unsigned long lastReconnectAttempt = 0;

bool reconnectAttempted = false;

void tryReconnect() {

    reconnectAttempted = true;
  
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Disconnected from Wi-Fi. Trying to reconnect...");
      
      connectionSetup();
    }
  
}

// Function to clear credentials
void clearCredentials() {
  if (!preferences.begin("wifi", false)) {
    Serial.println("Failed to open preferences for clearing.");
    return;
  }
  preferences.clear();
  preferences.end(); // Make sure to close the Preferences
  Serial.println("Credentials cleared, restarting...");
  delay(2000);
  ESP.restart();  // Restart to apply changes and potentially enter SoftAP mode
}

// Interrupt Service Routine (ISR)
void IRAM_ATTR handleInterrupt() {
  clearCredentials();
}

const uint8_t RESET_PIN= 21; //Reset Preferences PIN

void setup() {
  Serial.begin(115200);
  pinMode(RESET_PIN, INPUT_PULLUP);
   // Setup interrupt pin
  attachInterrupt(digitalPinToInterrupt(RESET_PIN), handleInterrupt, FALLING); // Trigger on falling edge

 
  // Config PINS to OUTPUT
  for (int i = 0; i < tot_pins; i++) {
    pinMode(gpio_pins[i], OUTPUT);
    digitalWrite(gpio_pins[i], LOW);
  }

  // connectionSetup();
   
}

unsigned long lastPollTime = 0;
const unsigned long pollInterval = 500;

unsigned long lastSoftAPTime = 0;
const unsigned long softAPInterval = 1*60000; // 2 minute

void loop() {

  if (WiFi.status() == WL_CONNECTED) {
    if(reconnectAttempted) setupMQTT();
    reconnectAttempted = false;

    if (!client.connected()) {
      reconnect();  // Reconnect to MQTT broker if disconnected
    }
    client.loop();  // Regularly handle MQTT tasks  

    unsigned long currentTime = millis();
    if (currentTime - lastPollTime >= pollInterval) {
        lastPollTime = currentTime;
        pollPinStates(); // Your periodic function
    }
  } else {

    unsigned long currentTime = millis();
    if (currentTime - lastSoftAPTime >= softAPInterval){
      Serial.println("SoftAP Timeout. Restarting...");
      ESP.restart();
    }

    if(!reconnectAttempted)  tryReconnect(); // Run only once
     
    server.handleClient(); // Will run continuously 
  }

  
}
