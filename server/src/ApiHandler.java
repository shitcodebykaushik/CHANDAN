import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

final class ApiHandler implements HttpHandler {
  @Override
  public void handle(HttpExchange exchange) throws IOException {
    HttpUtil.addCors(exchange.getResponseHeaders());
    if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
      exchange.sendResponseHeaders(204, -1);
      return;
    }

    String path = exchange.getRequestURI().getPath();
    String method = exchange.getRequestMethod().toUpperCase(Locale.US);

    if ("/api/health".equals(path)) {
      HttpUtil.sendJson(exchange, 200, "{\"ok\":true}");
      return;
    }
    if ("/api/config".equals(path)) {
      String mapKey = Objects.toString(System.getenv("GOOGLE_MAPS_PLATFORM_KEY"), "");
      HttpUtil.sendJson(exchange, 200, "{\"googleMapsPlatformKey\":\"" + JsonUtil.jsonEscape(mapKey) + "\"}");
      return;
    }
    if ("/api/zones".equals(path)) {
      HttpUtil.sendJson(exchange, 200, JsonUtil.toJsonArray(DataStore.zones()));
      return;
    }
    if ("/api/occupancy".equals(path)) {
      HttpUtil.sendJson(exchange, 200, JsonUtil.toJsonArray(DataStore.occupancy()));
      return;
    }
    if ("/api/activity".equals(path)) {
      HttpUtil.sendJson(exchange, 200, JsonUtil.toJsonArray(DataStore.activity()));
      return;
    }
    if ("/api/markers".equals(path)) {
      HttpUtil.sendJson(exchange, 200, JsonUtil.toJsonArray(DataStore.markers()));
      return;
    }
    if ("/api/vehicles".equals(path) && "GET".equals(method)) {
      HttpUtil.sendJson(exchange, 200, JsonUtil.toJsonArray(DataStore.vehicles()));
      return;
    }
    if ("/api/vehicles/book".equals(path) && "POST".equals(method)) {
      Map<String, String> body = HttpUtil.parseJsonBody(exchange);
      String plate = DataStore.normalizePlate(body.get("plate"));
      String zone = DataStore.safe(body.get("zone"));
      if (plate.isBlank() || zone.isBlank()) {
        HttpUtil.sendJson(exchange, 400, "{\"error\":\"Missing plate or zone\"}");
        return;
      }
      Map<String, Object> v = DataStore.bookVehicle(plate, zone);
      String token = Objects.toString(v.get("token"), "");
      String payload = "{\"token\":\"" + JsonUtil.jsonEscape(token) + "\",\"vehicle\":" + JsonUtil.toJsonObject(v) + "}";
      HttpUtil.sendJson(exchange, 200, payload);
      return;
    }
    if ("/api/vehicles/verify".equals(path) && "POST".equals(method)) {
      Map<String, String> body = HttpUtil.parseJsonBody(exchange);
      String token = DataStore.safe(body.get("token")).toUpperCase(Locale.US);
      if (token.isBlank()) {
        HttpUtil.sendJson(exchange, 400, "{\"error\":\"Missing token\"}");
        return;
      }
      DataStore.VerifyResult result = DataStore.verifyToken(token);
      if (!result.success) {
        HttpUtil.sendJson(exchange, 200, "{\"success\":false,\"msg\":\"" + JsonUtil.jsonEscape(result.msg) + "\"}");
        return;
      }
      String payload = "{\"success\":true,\"msg\":\"" + JsonUtil.jsonEscape(result.msg) + "\",\"vehicle\":" + JsonUtil.toJsonObject(result.vehicle) + "}";
      HttpUtil.sendJson(exchange, 200, payload);
      return;
    }

    HttpUtil.sendJson(exchange, 404, "{\"error\":\"Not found\"}");
  }
}
