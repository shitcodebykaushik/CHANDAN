import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

final class HttpUtil {
  private HttpUtil() {}

  static void addCors(Headers headers) {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }

  static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream os = exchange.getResponseBody()) {
      os.write(bytes);
    }
  }

  static void sendFile(HttpExchange exchange, Path file) throws IOException {
    String mime = mimeType(file.getFileName().toString());
    byte[] bytes = Files.readAllBytes(file);
    exchange.getResponseHeaders().set("Content-Type", mime);
    exchange.sendResponseHeaders(200, bytes.length);
    try (OutputStream os = exchange.getResponseBody()) {
      os.write(bytes);
    }
  }

  static String mimeType(String name) {
    String lower = name.toLowerCase(Locale.US);
    if (lower.endsWith(".html")) return "text/html; charset=utf-8";
    if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
    if (lower.endsWith(".css")) return "text/css; charset=utf-8";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    if (lower.endsWith(".json")) return "application/json; charset=utf-8";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".ico")) return "image/x-icon";
    return "application/octet-stream";
  }

  static Map<String, String> parseJsonBody(HttpExchange exchange) throws IOException {
    String body = readBody(exchange.getRequestBody());
    if (body.isBlank()) return Collections.emptyMap();
    Map<String, String> result = new HashMap<>();
    String trimmed = body.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      trimmed = trimmed.substring(1, trimmed.length() - 1);
    }
    String[] parts = trimmed.split(",");
    for (String part : parts) {
      String[] kv = part.split(":", 2);
      if (kv.length != 2) continue;
      String key = stripQuotes(kv[0].trim());
      String value = stripQuotes(kv[1].trim());
      result.put(key, value);
    }
    return result;
  }

  private static String readBody(InputStream is) throws IOException {
    try (InputStream input = is; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      byte[] buf = new byte[1024];
      int n;
      while ((n = input.read(buf)) > -1) {
        out.write(buf, 0, n);
      }
      return out.toString(StandardCharsets.UTF_8);
    }
  }

  private static String stripQuotes(String value) {
    String v = value;
    if (v.startsWith("\"") && v.endsWith("\"")) {
      v = v.substring(1, v.length() - 1);
    }
    return v;
  }
}
