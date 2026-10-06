package org.example;

import com.fastcgi.FCGIInterface;
import com.fastcgi.FCGIRequest;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class Main {
    public static void main(String[] args){
        FCGIInterface fcgiInterface = new FCGIInterface();

        while (fcgiInterface.FCGIaccept()>=0){
            FCGIRequest fcgiRequest = FCGIInterface.request;
            if (fcgiRequest == null) {
                System.err.println("CRITICAL ERROR: FCGIInterface.request is null after FCGIaccept()!");
                //TODO
                continue;
            }

            long startTime = System.nanoTime();
            String queryString = fcgiRequest.params.getProperty("QUERY_STRING");
            Map<String, String> params = parseQueryString(queryString);
            String validationErr = validateParams(params);
            if (validationErr != null){
                sendResponse(fcgiRequest, "{\"error\": \"" + validationErr + "\"}");
                continue;
            }
            double x = Double.parseDouble(params.get("x"));
            double y = Double.parseDouble(params.get("y"));
            double R = Double.parseDouble(params.get("r"));
            boolean isHit = checkHit(x,y,R);
            long endTime = System.nanoTime();
            double ms = (endTime - startTime) / 1_000_000.0;
            String response = String.format(Locale.US,
                    "{\"x\": %.2f, \"y\": %.2f, \"r\": %.2f, \"isHit\": %b, \"executionTime\": %.3f, \"currentTime\": \"%s\"}",
                    x, y, R, isHit, ms, Instant.now().truncatedTo(ChronoUnit.MILLIS)
            );
            sendResponse(fcgiRequest, response);

        }
    }
    private static void sendResponse(FCGIRequest fcgiRequest, String response){
        try {
            fcgiRequest.outStream.write("Content-Type: application/json; charset=UTF-8\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            fcgiRequest.outStream.write(response.getBytes(StandardCharsets.UTF_8));
            fcgiRequest.outStream.flush();
        }catch (IOException e){
            //TODO
        }
    }
    private static HashMap<String, String> parseQueryString(String queryString){
        HashMap<String, String> res = new HashMap<>();
        if (queryString == null || queryString.isEmpty()){
            return res;
        }
        String[] pairs = queryString.split("&");
        for (String pair: pairs){
            String[] p = pair.split("=", 2);
            String key = URLDecoder.decode(p[0], StandardCharsets.UTF_8);
            String value = p.length > 1 ? URLDecoder.decode(p[1], StandardCharsets.UTF_8) : "";
            res.put(key, value);
        }
        return res;
    }

    private static String validateParams(Map<String, String> params) {
        for (String k : new String[]{"x", "y", "r"}) {
            if (!params.containsKey(k)) return "Missing parameter: " + k;
        }
        try {
            double x = Double.parseDouble(params.get("x"));
            double y = Double.parseDouble(params.get("y"));
            double r = Double.parseDouble(params.get("r"));
            if (Double.isNaN(x) || Double.isInfinite(x) || Double.isNaN(y)
                    || Double.isInfinite(y) || Double.isNaN(r) || Double.isInfinite(r)) {
                return "Invalid number";
            }
            if (x < -4 || x > 4) return "x must be in [-4; 4]";
            if (y <= -3 || y >= 5) return "y must be in (-3; 5)";
            if (!java.util.List.of(1.0,1.5,2.0,2.5,3.0).contains(r))
                return "r must be one of 1, 1.5, 2, 2.5, 3";
        } catch (NumberFormatException e) {
            return "Invalid number format";
        }
        return null;
    }
    private static boolean checkHit(double x, double y, double R) {
        boolean inRectangle = (x >= 0 && x <= R) && (y >= 0 && y <= R / 2);
        boolean inTriangle = (x >= -R && x <= 0) && (y >= 0) && (y <= x / 2 + R / 2);
        boolean inCircle = (x <= 0 && y <= 0) && (x * x + y * y <= (R / 2) * (R / 2));
        return inRectangle || inCircle || inTriangle;
    }
}