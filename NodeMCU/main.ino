#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// Replace with your Wi-Fi and MQTT broker details
const char* wifi_ssid = "";        // Your Wi-Fi SSID
const char* wifi_password = "";     // Your Wi-Fi password
const char* mqtt_server = "192.168.228.205"; // MQTT broker's IP or hostname
const int mqtt_port = 8883;                  // MQTTS port
const char* sub_topic = "esp32/device_1/control";
const char* pub_topic = "esp32/device_1/status";

// MQTT credentials (if required)
const char* mqtt_user = "";
const char* mqtt_password = "";

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

// Wi-Fi and MQTT objects
WiFiClientSecure espClient; // Secure Wi-Fi client for MQTTS
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // Convert payload to a string
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Message: ");
  Serial.println(message);

  // Handle topics dynamically
  String received_topic = String(topic);

  // Check for specific topics
  if (received_topic.endsWith("/control")) {
    // Control topic logic
    if (message == "ON") {
      digitalWrite(gpio_pin, HIGH);
      Serial.println("GPIO 4 ON");
    } else if (message == "OFF") {
      digitalWrite(gpio_pin, LOW);
      Serial.println("GPIO 4 OFF");
    } 
  } else if (received_topic.endsWith("/status")) {
    // Handle status requests or acknowledgments
    Serial.println("Status topic message received: " + message);
    // Add logic for status if needed
  } else {
    Serial.println("Unhandled topic: " + received_topic);
  }
}

// Reconnect to MQTT broker
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTTS connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("Connected to MQTTS broker!");
      client.subscribe(sub_topic); // Subscribe to a topic
      Serial.print("Subscribed to: ");
      Serial.println(sub_topic);

      client.publish(pub_topic, "ESP32 connected");
      Serial.print("Published to: ");
      Serial.println(pub_topic);

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
  // espClient.setCACert(ca_cert); // Load CA certificate
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup() {
  Serial.begin(115200);
  pinMode(gpio_pin, OUTPUT);
  digitalWrite(gpio_pin, LOW);

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
