package org.example.http;

import com.fastcgi.FCGIRequest;
import org.example.logic.AreaChecker;
import org.example.models.CheckResult;
import org.example.models.Point;
import org.example.store.ResultStore;
import org.example.validation.ValidationResult;
import org.example.validation.Validator;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class Handler {
    private static final int MAX_BODY = 4096;
    private static final String FORM = "application/x-www-form-urlencoded";

    private final Validator validator;
    private final ResultStore store;

    public Handler(Validator validator, ResultStore store) {
        this.validator = validator;
        this.store = store;
    }

    public void handle(FCGIRequest req) {
        String method = req.params.getProperty("REQUEST_METHOD", "");
        switch (method) {
            case "GET" -> get(req);
            case "POST" -> post(req);
            case "DELETE" -> delete(req);
            default -> error(req, "405 Method Not Allowed", "Method not allowed: " + method);
        }
    }

    private void get(FCGIRequest req) {
        long start = System.nanoTime();
        Map<String, String> params = QueryParser.parse(req.params.getProperty("QUERY_STRING"));

        if (params.isEmpty()) {
            double ms = elapsedMs(start);
            ResponseWriter.sendResponse(req, "200 OK", JsonBuilder.list(store.list(), ms));
            return;
        }
        check(req, params, false, "200 OK", start);
    }

    private void post(FCGIRequest req) {
        long start = System.nanoTime();

        String type = req.params.getProperty("CONTENT_TYPE", "");
        if (!type.toLowerCase().startsWith(FORM)) {
            error(req, "415 Unsupported Media Type", "Content-Type must be " + FORM);
            return;
        }

        String body;
        try {
            body = readBody(req);
        } catch (IOException e) {
            error(req, "400 Bad Request", "Cannot read request body");
            return;
        }
        if (body == null) {
            error(req, "400 Bad Request", "Invalid or too large body");
            return;
        }
        check(req, QueryParser.parse(body), true, "201 Created", start);
    }

    private static String readBody(FCGIRequest req) throws IOException {
        String len = req.params.getProperty("CONTENT_LENGTH");
        if (len == null || len.isBlank()) return "";
        int n;
        try {
            n = Integer.parseInt(len.trim());
        } catch (NumberFormatException e) {
            return null;
        }
        if (n < 0 || n > MAX_BODY) return null;
        return new String(req.inStream.readNBytes(n), StandardCharsets.UTF_8);
    }

    private void delete(FCGIRequest req) {
        long start = System.nanoTime();
        store.clear();
        ResponseWriter.sendResponse(req, "200 OK", JsonBuilder.cleared(elapsedMs(start)));
    }

    private void check(FCGIRequest req, Map<String, String> params, boolean save, String okStatus, long start) {
        ValidationResult validation = validator.validate(params);
        if (!validation.isValid()) {
            ResponseWriter.sendResponse(req, "400 Bad Request", JsonBuilder.errors(validation.errors()));
            return;
        }
        Point point = validation.point();
        boolean hit = AreaChecker.isHit(point);
        CheckResult result = new CheckResult(point, hit, Instant.now(), elapsedMs(start));
        if (save) {
            store.add(result);
        }
        ResponseWriter.sendResponse(req, okStatus, JsonBuilder.item(result));
    }



    private static void error(FCGIRequest req, String status, String message) {
        ResponseWriter.sendResponse(req, status, JsonBuilder.errors(List.of(message)));
    }

    private static double elapsedMs(long start) {
        return (System.nanoTime() - start) / 1_000_000.0;
    }
}