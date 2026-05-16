import java.util.List;
import java.util.Map;
import java.util.Objects;

final class JsonUtil {
  private JsonUtil() {}

  static String toJsonArray(List<Map<String, Object>> list) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < list.size(); i++) {
      if (i > 0) sb.append(",");
      sb.append(toJsonObject(list.get(i)));
    }
    sb.append("]");
    return sb.toString();
  }

  static String toJsonObject(Map<String, Object> map) {
    StringBuilder sb = new StringBuilder();
    sb.append("{");
    int i = 0;
    for (Map.Entry<String, Object> entry : map.entrySet()) {
      if (i++ > 0) sb.append(",");
      sb.append("\"").append(jsonEscape(entry.getKey())).append("\":");
      Object value = entry.getValue();
      if (value instanceof Number || value instanceof Boolean) {
        sb.append(value);
      } else {
        sb.append("\"").append(jsonEscape(Objects.toString(value, ""))).append("\"");
      }
    }
    sb.append("}");
    return sb.toString();
  }

  static String jsonEscape(Object value) {
    String s = Objects.toString(value, "");
    return s.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}
