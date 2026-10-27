package org.example.http;

import org.example.models.CheckResult;
import org.example.models.Point;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

public final class JsonBuilder {

    public static String result(Point p, boolean isHit, double ms) {
        return String.format(Locale.US,
                "{\"x\": %.2f, \"y\": %.2f, \"r\": %.2f, \"isHit\": %b, \"executionTime\": %.3f, \"currentTime\": \"%s\"}",
                p.x(), p.y(), p.r(), isHit, ms, Instant.now().truncatedTo(ChronoUnit.MILLIS));
    }

    public static String errors(List<String> errors) {
        StringBuilder sb = new StringBuilder("{\"errors\": [");
        for (int i = 0; i < errors.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append('"')
                    .append(errors.get(i).replace("\\", "\\\\").replace("\"", "\\\""))
                    .append('"');
        }
        return sb.append("]}").toString();
    }
    public static String item(CheckResult c) {
        Point p = c.point();
        return String.format(Locale.US,
                "{\"x\": %.2f, \"y\": %.2f, \"r\": %.2f, \"isHit\": %b, \"currentTime\": \"%s\", \"executionTime\": %.3f}",
                p.x(), p.y(), p.r(), c.hit(), c.checkedAt().truncatedTo(ChronoUnit.MILLIS), c.executionMs());
    }

    public static String list(List<CheckResult> items, double ms) {
        StringBuilder sb = new StringBuilder("{\"results\": [");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(item(items.get(i)));
        }
        return sb.append(String.format(Locale.US, "], \"executionTime\": %.3f}", ms)).toString();
    }

    public static String cleared(double ms) {
        return String.format(Locale.US, "{\"cleared\": true, \"executionTime\": %.3f}", ms);
    }
}