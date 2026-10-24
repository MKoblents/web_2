package org.example;

import com.fastcgi.FCGIInterface;
import com.fastcgi.FCGIRequest;
import org.example.http.JsonBuilder;
import org.example.http.QueryParser;
import org.example.http.ResponseWriter;
import org.example.logic.AreaChecker;
import org.example.models.Point;
import org.example.validation.ValidationResult;
import org.example.validation.Validator;

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
            Point p = new Point(x,y,R);
            boolean isHit = AreaChecker.isHit(p);
            long endTime = System.nanoTime();
            double ms = (endTime - startTime) / 1_000_000.0;
            String response = JsonBuilder.result(p,isHit,ms);
            ResponseWriter.sendResponse(fcgiRequest,"200 OK", response);

        }
    }


}