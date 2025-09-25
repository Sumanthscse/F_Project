/* ESP32 Vehicle Tracker - GPS + SIM900A + WebConfig + Relay
   - WiFi AP for config (or connect to WiFi if credentials exist)
   - Stores config in SPIFFS/LittleFS
   - Reads GPS from Serial1
   - Communicates with SIM900A via Serial2 (AT commands)
   - Sends telemetry via HTTP POST to backend
   - Geofence alerts via SMS
   - On incoming call: send SMS with live location to caller
   - Relay control via SMS command from owner

Required libraries:
  - TinyGPSPlus
  - WiFi
  - WebServer (ESPAsyncWebServer or WebServer OK)
  - SPIFFS or LittleFS (here we use SPIFFS)
*/

#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>
#include <TinyGPSPlus.h>
#include <HTTPClient.h>

#define GPS_RX_PIN 16   // to GPS TX
#define GPS_TX_PIN 17   // to GPS RX (not used much)
#define SIM_RX_PIN 4    // to SIM900 TX
#define SIM_TX_PIN 15   // to SIM900 RX
#define RELAY_PIN 2     // GPIO to control starter relay (use transistor/driver)
#define LED_PIN 13

// backend URL (set to your server)
const char* BACKEND_URL = "http://YOUR_SERVER:5000/api/telemetry";

TinyGPSPlus gps;
WebServer server(80);

HardwareSerial SerialGPS(1); // UART1
HardwareSerial SerialSIM(2); // UART2

// config structure stored in SPIFFS as JSON
struct Config {
  String truckNumber;
  String ownerNumber;
  String driverName;
  double geofenceLat;
  double geofenceLng;
  double geofenceRadius; // meters
  bool wifiConfigured;
  String wifiSsid;
  String wifiPass;
} cfg;

bool relayAllowed = false;
unsigned long relayAllowUntil = 0;

void loadConfig() {
  if(!SPIFFS.begin(true)) return;
  if(!SPIFFS.exists("/config.json")) {
    cfg.truckNumber = "";
    cfg.ownerNumber = "";
    cfg.driverName = "";
    cfg.geofenceLat = 0;
    cfg.geofenceLng = 0;
    cfg.geofenceRadius = 0;
    cfg.wifiConfigured = false;
    cfg.wifiSsid = "";
    cfg.wifiPass = "";
    return;
  }
  File f = SPIFFS.open("/config.json","r");
  if(!f) return;
  String s = f.readString(); f.close();
  DynamicJsonDocument d(1024);
  deserializeJson(d,s);
  cfg.truckNumber = String((const char*)d["truckNumber"] | "");
  cfg.ownerNumber = String((const char*)d["ownerNumber"] | "");
  cfg.driverName = String((const char*)d["driverName"] | "");
  cfg.geofenceLat = (double)(d["geofenceLat"] | 0.0);
  cfg.geofenceLng = (double)(d["geofenceLng"] | 0.0);
  cfg.geofenceRadius = (double)(d["geofenceRadius"] | 0.0);
  cfg.wifiConfigured = (bool)(d["wifiConfigured"] | false);
  cfg.wifiSsid = String((const char*)d["wifiSsid"] | "");
  cfg.wifiPass = String((const char*)d["wifiPass"] | "");
}

void saveConfig() {
  DynamicJsonDocument d(1024);
  d["truckNumber"] = cfg.truckNumber;
  d["ownerNumber"] = cfg.ownerNumber;
  d["driverName"] = cfg.driverName;
  d["geofenceLat"] = cfg.geofenceLat;
  d["geofenceLng"] = cfg.geofenceLng;
  d["geofenceRadius"] = cfg.geofenceRadius;
  d["wifiConfigured"] = cfg.wifiConfigured;
  d["wifiSsid"] = cfg.wifiSsid;
  d["wifiPass"] = cfg.wifiPass;
  File f = SPIFFS.open("/config.json","w");
  if(!f) return;
  serializeJson(d, f);
  f.close();
}

// helper to send AT command and wait a bit
String simSendCmd(const String &cmd, unsigned long timeout=1000) {
  while(SerialSIM.available()) SerialSIM.read(); // flush
  SerialSIM.println(cmd);
  unsigned long t = millis();
  String res = "";
  while(millis()-t < timeout) {
    while(SerialSIM.available()) {
      char c = SerialSIM.read();
      res += c;
    }
    if (res.indexOf("OK") >=0 || res.indexOf("ERROR")>=0 || res.indexOf("+CLCC")>=0 || res.indexOf("RING")>=0) break;
  }
  return res;
}

void sendSms(const String &to, const String &message) {
  // Set text mode
  simSendCmd("AT+CMGF=1",500);
  String cmd = String("AT+CMGS=\"") + to + "\"";
  SerialSIM.println(cmd);
  delay(150);
  SerialSIM.print(message);
  delay(100);
  SerialSIM.write(0x1A); // Ctrl+Z
  delay(1000);
}

void handleIncomingSim() {
  // read lines from SIM and look for RING and CLIP
  static String buffer = "";
  while(SerialSIM.available()) {
    char c = SerialSIM.read();
    buffer += c;
    if(c == '\n') {
      // process line
      String s = buffer;
      s.trim();
      if(s.indexOf("RING") >= 0) {
        // Caller incoming - issue AT+CLCC to get number might not be immediate, so rely on +CLIP earlier
      }
      if(s.startsWith("+CLIP:")) {
        // +CLIP: "number",145,...
        int q1 = s.indexOf('"');
        int q2 = s.indexOf('"', q1+1);
        String caller = s.substring(q1+1,q2);
        // reply with SMS containing current location
        if(gps.location.isValid()) {
          String msg = "Live location: https://maps.google.com/?q=" + String(gps.location.lat(),6) + "," + String(gps.location.lng(),6);
          sendSms(caller, msg);
        } else {
          sendSms(caller, "Location not available.");
        }
      }
      // also process SMS commands (receive SMS text notifications require setting AT+CNMI)
      buffer = "";
    }
  }
}

double calcDistanceMeters(double lat1,double lon1,double lat2,double lon2) {
  const double R = 6371000.0;
  double dLat = (lat2-lat1)*M_PI/180.0;
  double dLon = (lon2-lon1)*M_PI/180.0;
  double a = sin(dLat/2)*sin(dLat/2)+cos(lat1*M_PI/180.0)*cos(lat2*M_PI/180.0)*sin(dLon/2)*sin(dLon/2);
  double c = 2*atan2(sqrt(a),sqrt(1-a));
  return R*c;
}

void sendTelemetry(double lat, double lng, double speed) {
  if(WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  DynamicJsonDocument doc(256);
  doc["truckNumber"] = cfg.truckNumber;
  doc["driverName"] = cfg.driverName;
  doc["ownerNumber"] = cfg.ownerNumber;
  doc["lat"] = lat;
  doc["lng"] = lng;
  doc["speed"] = speed;
  doc["ts"] = millis();
  String body;
  serializeJson(doc, body);
  int code = http.POST(body);
  http.end();
}

void handleConfigWeb() {
  // serve basic HTML form for truck details - simplified
  if (server.method() == HTTP_POST) {
    if (server.arg("truckNumber").length()) cfg.truckNumber = server.arg("truckNumber");
    if (server.arg("ownerNumber").length()) cfg.ownerNumber = server.arg("ownerNumber");
    if (server.arg("driverName").length()) cfg.driverName = server.arg("driverName");
    if (server.arg("geofenceLat").length()) cfg.geofenceLat = server.arg("geofenceLat").toDouble();
    if (server.arg("geofenceLng").length()) cfg.geofenceLng = server.arg("geofenceLng").toDouble();
    if (server.arg("geofenceRadius").length()) cfg.geofenceRadius = server.arg("geofenceRadius").toDouble();
    saveConfig();
    server.send(200, "text/html", "<h3>Saved. Reboot device to apply.</h3>");
    return;
  }
  String html = "<html><body><h3>Vehicle Config</h3><form method='POST'>";
  html += "Truck number:<br><input name='truckNumber' value='" + cfg.truckNumber + "'><br>";
  html += "Owner number (+countrycode):<br><input name='ownerNumber' value='" + cfg.ownerNumber + "'><br>";
  html += "Driver name:<br><input name='driverName' value='" + cfg.driverName + "'><br>";
  html += "Geofence lat:<br><input name='geofenceLat' value='" + String(cfg.geofenceLat,6) + "'><br>";
  html += "Geofence lng:<br><input name='geofenceLng' value='" + String(cfg.geofenceLng,6) + "'><br>";
  html += "Geofence radius (m):<br><input name='geofenceRadius' value='" + String(cfg.geofenceRadius) + "'><br><br>";
  html += "<input type='submit' value='Save'></form></body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  SPIFFS.begin(true);
  loadConfig();

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  pinMode(LED_PIN, OUTPUT);

  // start serial ports
  SerialGPS.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  SerialSIM.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);

  // Start WiFi: if we have saved WiFi then connect, otherwise start AP for config
  if(cfg.wifiConfigured && cfg.wifiSsid.length()>0) {
    WiFi.begin(cfg.wifiSsid.c_str(), cfg.wifiPass.c_str());
    unsigned long t0 = millis();
    while(WiFi.status()!=WL_CONNECTED && millis()-t0<15000) delay(200);
  }

  if(WiFi.status() != WL_CONNECTED) {
    WiFi.softAP("TruckConfigAP");
    IPAddress IP = WiFi.softAPIP();
    Serial.println("AP started: " + IP.toString());
  } else {
    Serial.println("Connected to WiFi: " + WiFi.localIP().toString());
  }

  server.on("/", HTTP_GET, [](){ server.send(200,"text/plain","ESP32 Vehicle Tracker"); });
  server.on("/config", HTTP_GET | HTTP_POST, handleConfigWeb);
  server.begin();

  // SIM900 setup
  simSendCmd("AT"); delay(200);
  simSendCmd("ATE0"); // disable echo
  simSendCmd("AT+CNMI=2,1,0,0,0"); // SMS notifications to UART
  simSendCmd("AT+CLIP=1"); // caller id
}

unsigned long lastTelemetry = 0;
bool geofenceStateInside = false;

void loop() {
  server.handleClient();

  // read GPS chars
  while(SerialGPS.available()) {
    char c = SerialGPS.read();
    gps.encode(c);
  }

  // handle SIM responses (incoming call, SMS)
  handleIncomingSim();

  // periodic telemetry every 10s
  unsigned long now = millis();
  if(now - lastTelemetry > 10000) {
    lastTelemetry = now;
    if(gps.location.isValid()) {
      double lat = gps.location.lat();
      double lng = gps.location.lng();
      double sp = gps.speed.kmph();
      sendTelemetry(lat,lng,sp);

      // geofence evaluation
      if(cfg.geofenceRadius > 0) {
        double d = calcDistanceMeters(lat,lng,cfg.geofenceLat,cfg.geofenceLng);
        bool nowInside = (d <= cfg.geofenceRadius);
        if(nowInside && !geofenceStateInside) {
          // entered
          geofenceStateInside = true;
          String msg = "Vehicle " + cfg.truckNumber + " entered geofence at " + String(lat,6) + "," + String(lng,6);
          sendSms(cfg.ownerNumber, msg);
        } else if(!nowInside && geofenceStateInside) {
          // exited
          geofenceStateInside = false;
          String msg = "Vehicle " + cfg.truckNumber + " exited geofence at " + String(lat,6) + "," + String(lng,6);
          sendSms(cfg.ownerNumber, msg);
        }
      }
    }
  }

  // read SMS text messages for commands - this is simplified: you may parse +CMTI and read via AT+CMGR
  if(SerialSIM.available()) {
    String s = "";
    while(SerialSIM.available()) s += char(SerialSIM.read());
    s.toUpperCase();
    // Example command: ALLOW_START 10 (minutes) or REVOKE_START
    if(s.indexOf("ALLOW_START")>=0 && s.indexOf(cfg.ownerNumber) >= 0) {
      // in many modules, you'll need to get sender number from +CMTI or +CMGR - simplified here
      relayAllowed = true;
      relayAllowUntil = millis() + (10UL*60UL*1000UL); // default 10 min
      digitalWrite(RELAY_PIN, HIGH);
    } else if(s.indexOf("REVOKE_START")>=0) {
      relayAllowed = false;
      digitalWrite(RELAY_PIN, LOW);
    }
  }

  // auto timeout relay
  if(relayAllowed && relayAllowUntil > 0 && millis() > relayAllowUntil) {
    relayAllowed = false;
    digitalWrite(RELAY_PIN, LOW);
  }

  delay(10);
}
