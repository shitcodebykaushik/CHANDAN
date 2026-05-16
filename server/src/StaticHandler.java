import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

final class StaticHandler implements HttpHandler {
  @Override
  public void handle(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    if (path.startsWith("/api/")) {
      exchange.sendResponseHeaders(404, -1);
      return;
    }

    Path distRoot = Path.of("dist");
    Path target = resolvePath(distRoot, path);
    if (Files.exists(target) && !Files.isDirectory(target)) {
      HttpUtil.sendFile(exchange, target);
      return;
    }

    Path index = distRoot.resolve("index.html");
    if (Files.exists(index)) {
      HttpUtil.sendFile(exchange, index);
      return;
    }

    byte[] body = "Build the frontend first: npm run build".getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
    exchange.sendResponseHeaders(404, body.length);
    try (OutputStream os = exchange.getResponseBody()) {
      os.write(body);
    }
  }

  private static Path resolvePath(Path distRoot, String rawPath) {
    String clean = rawPath == null || rawPath.isBlank() ? "/" : rawPath;
    if (clean.equals("/")) return distRoot.resolve("index.html");
    if (clean.startsWith("/")) clean = clean.substring(1);
    return distRoot.resolve(clean).normalize();
  }
}
