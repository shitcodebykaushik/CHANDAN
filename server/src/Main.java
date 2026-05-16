import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class Main {
  public static void main(String[] args) throws Exception {
    DataStore.seedData();

    int port = parseIntOrDefault(System.getenv("PORT"), 8080);
    String host = System.getenv("HOST");
    InetSocketAddress addr = host == null || host.isBlank()
        ? new InetSocketAddress(port)
        : new InetSocketAddress(host, port);

    HttpServer server = HttpServer.create(addr, 0);
    server.createContext("/api/", new ApiHandler());
    server.createContext("/", new StaticHandler());
    server.setExecutor(null);
    server.start();

    System.out.println("Server running on http://" + addr.getHostString() + ":" + addr.getPort());
  }
  private static int parseIntOrDefault(String value, int fallback) {
    if (value == null || value.isBlank()) return fallback;
    try {
      return Integer.parseInt(value.trim());
    } catch (NumberFormatException e) {
      return fallback;
    }
  }
}
