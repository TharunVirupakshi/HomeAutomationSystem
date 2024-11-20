#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// Replace with your Wi-Fi and MQTT broker details
const char* wifi_ssid = "Tharun'sGalaxy M32";        // Your Wi-Fi SSID
const char* wifi_password = "asdfghjkl";     // Your Wi-Fi password
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
char config_topic[50];   // "esp32/<device_id>/config"
char status_topic[50];   // "esp32/<device_id>/status"
char control_topic[50];  // "esp32/<device_id>/control"


// Function to generate topics
void generateTopics() {
  snprintf(config_topic, sizeof(config_topic), "esp32/%s/config", device_id);
  snprintf(status_topic, sizeof(status_topic), "esp32/%s/status", device_id);
  snprintf(control_topic, sizeof(control_topic), "esp32/%s/control", device_id);
}

// GPIO pin states
const int gpio_pins[] = {4, 5, 16}; // Example pins to configure/control
int pin_states[sizeof(gpio_pins) / sizeof(gpio_pins[0])] = {0}; // Pin states

// Publish device status
void publishStatus() {
  char status_message[200];
  snprintf(status_message, sizeof(status_message), "{ \"device_id\": \"%s\", \"pins\": {", device_id);
  for (size_t i = 0; i < sizeof(gpio_pins) / sizeof(gpio_pins[0]); i++) {
    char pin_status[50];
    snprintf(pin_status, sizeof(pin_status), "\"%d\": \"%s\"%s", gpio_pins[i], 
             pin_states[i] ? "HIGH" : "LOW", 
             (i == sizeof(gpio_pins) / sizeof(gpio_pins[0]) - 1) ? " } }" : ", ");
    strncat(status_message, pin_status, sizeof(status_message) - strlen(status_message) - 1);
  }
  client.publish(status_topic, status_message);
  Serial.print("Published status: ");
  Serial.println(status_message);
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

// GPIO pin for control
const int gpio_pin = 4;




// Callback for MQTT messages
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0'; // Null-terminate the payload

  Serial.print("Message: ");
  Serial.println(message);

  // Handle control messages
  if (strcmp(topic, control_topic) == 0) {
    int pin;
    char state[10];
    if (sscanf(message, "{ \"pin\": %d, \"state\": \"%s\" }", &pin, state) == 2) {
      for (size_t i = 0; i < sizeof(gpio_pins) / sizeof(gpio_pins[0]); i++) {
        if (gpio_pins[i] == pin) {
          if (strcmp(state, "HIGH\"") == 0) {
            digitalWrite(pin, HIGH);
            pin_states[i] = 1;
            Serial.printf("Pin %d set to HIGH\n", pin);
          } else if (strcmp(state, "LOW\"") == 0) {
            digitalWrite(pin, LOW);
            pin_states[i] = 0;
            Serial.printf("Pin %d set to LOW\n", pin);
          }
          publishStatus(); // Report status after change
        }
      }
    }else if(strcmp(message, "GET_STATUS") == 0){
      publishStatus();
    }
  }
  // Handle configuration messages
  else if (strcmp(topic, config_topic) == 0) {
    char new_device_id[20];
    if (sscanf(message, "{ \"device_id\": \"%[^\"]\" }", new_device_id) == 1) {
      Serial.printf("Device ID updated from %s to %s\n", device_id, new_device_id);
      device_id = strdup(new_device_id); // Update the device ID
      generateTopics(); // Regenerate topics
      client.subscribe(config_topic);
      client.subscribe(control_topic);
    }
  }
}

// Reconnect to MQTT broker
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTTS connection...");
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("Connected to MQTTS broker!");

      // Subscribe to topics
      client.subscribe(config_topic);
      client.subscribe(control_topic);

      Serial.print("Subscribed to: ");
      Serial.println(config_topic);
      Serial.println(control_topic);

      // Publish initial status
      publishStatus();
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Trying again in 5 seconds...");
      delay(5000);
    }
  }
}

// Configure MQTTS
void setupMQTT() {
   // Generate MQTT topics
  generateTopics();
  espClient.setCACert(ca_cert); // Load CA certificate
  // espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup() {
  Serial.begin(115200);

  // Config PINS to OUTPUT
  for (size_t i = 0; i < sizeof(gpio_pins) / sizeof(gpio_pins[0]); i++) {
    pinMode(gpio_pins[i], OUTPUT);
    digitalWrite(gpio_pins[i], LOW);
  }

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(wifi_ssid, wifi_password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    setupMQTT(); // Set up MQTTS after Wi-Fi connection
  } else {
    Serial.println("\nFailed to connect to Wi-Fi.");
  }
}

void loop() {
  // Handle MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
