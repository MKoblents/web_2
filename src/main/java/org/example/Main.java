package org.example;

import com.fastcgi.FCGIInterface;
import com.fastcgi.FCGIRequest;
import org.example.http.JsonBuilder;
import org.example.http.QueryParser;
import org.example.http.ResponseWriter;
import org.example.models.Point;
import org.example.validation.ValidationResult;
import org.example.validation.Validator;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class Main {
    public static void main(String[] args){
        FCGIInterface fcgiInterface = new FCGIInterface();
        Validator validator = new Validator(-4, 4, -3, 3, Set.of(1.0, 1.5, 2.0, 2.5, 3.0));

        while (fcgiInterface.FCGIaccept()>=0){
            FCGIRequest fcgiRequest = FCGIInterface.request;
            if (fcgiRequest == null || fcgiRequest.params == null || fcgiRequest.outStream == null) {
                continue;
            }
//            System.err.println(fcgiRequest.params);
//            System.err.println(fcgiRequest.params.stringPropertyNames());
//            System.err.println("before");
//            System.err.println(fcgiRequest.params.getProperty("SERVER_SIGNATURE"));
//            System.err.println("after");
            long startTime = System.nanoTime();
            String queryString = fcgiRequest.params.getProperty("QUERY_STRING");
            Map<String, String> params = QueryParser.parse(queryString);
            ValidationResult validationResult = validator.validate(params);
            if (!validationResult.isValid()){
                ResponseWriter.sendResponse(fcgiRequest, "400 Bad Request", JsonBuilder.errors(validationResult.errors()));
                continue;
            }
            double x = Double.parseDouble(params.get("x"));
            double y = Double.parseDouble(params.get("y"));
            double R = Double.parseDouble(params.get("r"));
            boolean isHit = checkHit(x,y,R);
            long endTime = System.nanoTime();
            double ms = (endTime - startTime) / 1_000_000.0;
            Point p = new Point(x,y,R);
            String response = JsonBuilder.result(p,isHit,ms);
            ResponseWriter.sendResponse(fcgiRequest,"200 OK", response);

        }
    }

    private static boolean checkHit(double x, double y, double R) {
        boolean inRectangle = (x >= -R && x <= 0) && (y >= -R && y <= 0);
        boolean inTriangle = (x >= -R && x <= 0) && (y >= 0) && (y <= x / 2 + R / 2);
        boolean inCircle = (x >= 0 && x <= R) && (y >= 0 && y <= R) && (x * x + y * y <= R * R);
        return inRectangle || inCircle || inTriangle;
    }

}