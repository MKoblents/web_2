package org.example;

import com.fastcgi.FCGIInterface;
import com.fastcgi.FCGIRequest;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) throws IOException {
        FCGIInterface fcgiInterface = new FCGIInterface();

        while (fcgiInterface.FCGIaccept()>=0){
            FCGIRequest fcgiRequest = FCGIInterface.request;
            long startTime = System.nanoTime();
            String queryString = fcgiRequest.params.getProperty("QUERY_STRING");
            Map<String, String> params = parseQueryString(queryString);
            String validationErr = validateParams(params);
            if (validationErr != null){
                fcgiRequest.outStream.write("Content-Type: application/json; charset=UTF-8\r\n\r\n".getBytes(StandardCharsets.UTF_8));
                fcgiRequest.outStream.write(("{\"error\": \"" + validationErr + "\"}").getBytes(StandardCharsets.UTF_8));
                fcgiRequest.outStream.flush();
                continue;
            }
            double x = Double.parseDouble(params.get("x"));
            double y = Double.parseDouble(params.get("y"));
            double R = Double.parseDouble(params.get("r"));
            boolean isHit = checkHit(x,y,R);
            long endTime = System.nanoTime();
            double sec = (endTime-startTime)/1_000_000.0;
            byte[] res = String.format(
                    "{\"x\": %.2f, \"y\": %.2f, \"r\": %.2f, \"isHit\": %b, \"executionTime\": %.3f, \"currentTime\": \"%s\"}",
                    x, y, R, isHit, sec, LocalDateTime.now()
            ).getBytes(StandardCharsets.UTF_8);
            fcgiRequest.outStream.write("Content-Type: application/json; charset=UTF-8\r\n\r\n".getBytes(StandardCharsets.UTF_8));
            fcgiRequest.outStream.write(res);
            fcgiRequest.outStream.flush();

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

    private static String validateParams(Map<String, String> params){
        if (!params.containsKey("x")){
            return "Missing parameter: x.";
        }
        if (!params.containsKey("y")){
            return "Missing parameter: y.";
        }
        if (!params.containsKey("r")){
            return "Missing parameter: r.";
        }
        try {
            double x = Double.parseDouble(params.get("x"));
            double y = Double.parseDouble(params.get("y"));
            double r = Double.parseDouble(params.get("r"));
            if (r<=0){
                return "Invalid r: must be grater than 0.";
            }
        }catch (NumberFormatException e){
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