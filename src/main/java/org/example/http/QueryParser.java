package org.example.http;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public final class QueryParser {
    public static Map<String, String> parse(String query) {
        Map<String, String> res = new HashMap<>();
        if (query == null || query.isEmpty()) return res;
        for (String pair : query.split("&")) {
            if (pair.isEmpty()) continue;
            String[] p = pair.split("=", 2);
            String key = URLDecoder.decode(p[0], StandardCharsets.UTF_8);
            String value = p.length > 1 ? URLDecoder.decode(p[1], StandardCharsets.UTF_8) : "";
            res.put(key, value);
        }
        return res;
    }
}