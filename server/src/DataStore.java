import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

final class DataStore {
  private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm", Locale.US);
  private static final Random RANDOM = new Random();

  private static final List<Map<String, Object>> ZONES = new ArrayList<>();
  private static final List<Map<String, Object>> OCCUPANCY = new ArrayList<>();
  private static final List<Map<String, Object>> ACTIVITY = new ArrayList<>();
  private static final List<Map<String, Object>> VEHICLES = new ArrayList<>();
  private static final List<Map<String, Object>> MARKERS = new ArrayList<>();

  private DataStore() {}

  static void seedData() {
    if (!ZONES.isEmpty()) return;

    ZONES.add(zone("Z-Alpha", "Downtown Core", 450, 412, "critical"));
    ZONES.add(zone("Z-Beta", "Financial District", 320, 298, "warning"));
    ZONES.add(zone("Z-Gamma", "Tech Park", 800, 450, "good"));
    ZONES.add(zone("Z-Delta", "Westside Residential", 250, 210, "warning"));
    ZONES.add(zone("Z-Epsilon", "Transit Hub", 600, 580, "critical"));

    OCCUPANCY.add(occupancy("06:00", 20));
    OCCUPANCY.add(occupancy("08:00", 65));
    OCCUPANCY.add(occupancy("10:00", 85));
    OCCUPANCY.add(occupancy("12:00", 90));
    OCCUPANCY.add(occupancy("14:00", 75));
    OCCUPANCY.add(occupancy("16:00", 80));
    OCCUPANCY.add(occupancy("18:00", 60));
    OCCUPANCY.add(occupancy("20:00", 35));
    OCCUPANCY.add(occupancy("22:00", 15));

    ACTIVITY.add(activity(1, "violation", "Overstay detected at Z-Alpha / Spot 42", "2 min ago"));
    ACTIVITY.add(activity(2, "entry", "Vehicle entered Z-Beta / Gate 2", "4 min ago"));
    ACTIVITY.add(activity(3, "alert", "Sensor offline in Z-Gamma / Level 2", "12 min ago"));
    ACTIVITY.add(activity(4, "exit", "Vehicle exited Z-Epsilon / Gate 1", "15 min ago"));
    ACTIVITY.add(activity(5, "entry", "Vehicle entered Z-Alpha / Gate 4", "18 min ago"));

    VEHICLES.add(vehicle("V-101", "XYZ-1234", "parked", "TKN-A1B2C3", "Z-Alpha", "10:42"));
    VEHICLES.add(vehicle("V-102", "ABC-9876", "parked", "TKN-X9Y8Z7", "Z-Beta", "09:15"));
    VEHICLES.add(vehicle("V-103", "LMN-4567", "booked", "TKN-QW3E4R", "Z-Gamma", "-"));
    VEHICLES.add(vehicle("V-104", "PQR-1122", "parked", "TKN-H8J9K0", "Z-Alpha", "11:00"));

    MARKERS.add(marker("M-1", 37.7849, -122.4094, "critical"));
    MARKERS.add(marker("M-2", 37.7649, -122.4294, "warning"));
    MARKERS.add(marker("M-3", 37.7739, -122.4312, "good"));
    MARKERS.add(marker("M-4", 37.7949, -122.3994, "good"));
    MARKERS.add(marker("M-5", 37.7549, -122.4094, "critical"));
  }

  static List<Map<String, Object>> zones() {
    return ZONES;
  }

  static List<Map<String, Object>> occupancy() {
    return OCCUPANCY;
  }

  static List<Map<String, Object>> activity() {
    return ACTIVITY;
  }

  static List<Map<String, Object>> vehicles() {
    return VEHICLES;
  }

  static List<Map<String, Object>> markers() {
    return MARKERS;
  }

  static Map<String, Object> bookVehicle(String plate, String zone) {
    String token = generateToken();
    String id = "V-" + (200 + RANDOM.nextInt(800));
    Map<String, Object> v = vehicle(id, normalizePlate(plate), "booked", token, zone, "-");
    synchronized (VEHICLES) {
      VEHICLES.add(0, v);
    }
    pushActivity("entry", "Booking created for " + plate + " in " + zone);
    return v;
  }

  static VerifyResult verifyToken(String token) {
    Map<String, Object> found = null;
    synchronized (VEHICLES) {
      for (Map<String, Object> v : VEHICLES) {
        if (token.equalsIgnoreCase(Objects.toString(v.get("token"), ""))) {
          found = v;
          break;
        }
      }
      if (found == null) {
        return new VerifyResult(false, "Invalid Token. No matching booking found.", null);
      }
      String status = Objects.toString(found.get("status"), "");
      if ("parked".equalsIgnoreCase(status)) {
        return new VerifyResult(false, "Vehicle " + found.get("plate") + " is already parked.", found);
      }
      String time = LocalTime.now().format(TIME_FORMAT) + " (Now)";
      found.put("status", "parked");
      found.put("time", time);
    }
    pushActivity("entry", "Token verified for " + token);
    return new VerifyResult(true, "Token verified! Access granted.", found);
  }

  static String safe(String value) {
    return value == null ? "" : value.trim();
  }

  static String normalizePlate(String value) {
    return safe(value).toUpperCase(Locale.US);
  }

  private static Map<String, Object> zone(String id, String name, int total, int occupied, String status) {
    Map<String, Object> z = new HashMap<>();
    z.put("id", id);
    z.put("name", name);
    z.put("total", total);
    z.put("occupied", occupied);
    z.put("status", status);
    return z;
  }

  private static Map<String, Object> occupancy(String time, int value) {
    Map<String, Object> o = new HashMap<>();
    o.put("time", time);
    o.put("occupancy", value);
    return o;
  }

  private static Map<String, Object> activity(int id, String type, String msg, String time) {
    Map<String, Object> a = new HashMap<>();
    a.put("id", id);
    a.put("type", type);
    a.put("msg", msg);
    a.put("time", time);
    return a;
  }

  private static Map<String, Object> vehicle(String id, String plate, String status, String token, String zone, String time) {
    Map<String, Object> v = new HashMap<>();
    v.put("id", id);
    v.put("plate", plate);
    v.put("status", status);
    v.put("token", token);
    v.put("zone", zone);
    v.put("time", time);
    return v;
  }

  private static Map<String, Object> marker(String id, double lat, double lng, String status) {
    Map<String, Object> m = new HashMap<>();
    m.put("id", id);
    m.put("lat", lat);
    m.put("lng", lng);
    m.put("status", status);
    return m;
  }

  private static String generateToken() {
    String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    StringBuilder sb = new StringBuilder("TKN-");
    for (int i = 0; i < 6; i++) {
      sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
    }
    return sb.toString();
  }

  private static void pushActivity(String type, String msg) {
    synchronized (ACTIVITY) {
      int nextId = ACTIVITY.isEmpty() ? 1 : ((Number) ACTIVITY.get(0).get("id")).intValue() + 1;
      ACTIVITY.add(0, activity(nextId, type, msg, "just now"));
      if (ACTIVITY.size() > 50) {
        ACTIVITY.remove(ACTIVITY.size() - 1);
      }
    }
  }

  static final class VerifyResult {
    final boolean success;
    final String msg;
    final Map<String, Object> vehicle;

    VerifyResult(boolean success, String msg, Map<String, Object> vehicle) {
      this.success = success;
      this.msg = msg;
      this.vehicle = vehicle;
    }
  }
}
