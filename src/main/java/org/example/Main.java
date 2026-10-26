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

    private static final Validator VALIDATOR =
            new Validator(-4, 4, -3, 3, Set.of(1.0, 1.5, 2.0, 2.5, 3.0));
    public static void main(String[] args){
        FCGIInterface fcgiInterface = new FCGIInterface();
        while (fcgiInterface.FCGIaccept()>=0){
            FCGIRequest fcgiRequest = FCGIInterface.request;
            if (fcgiRequest == null || fcgiRequest.params == null || fcgiRequest.outStream == null) {
                continue;
            }
            handle(fcgiRequest);
//            System.err.println(fcgiRequest.params);
//            System.err.println(fcgiRequest.params.stringPropertyNames());
//            System.err.println("before");
//            System.err.println(fcgiRequest.params.getProperty("SERVER_SIGNATURE"));
//            System.err.println("after");
        }
    }

    private static void handle(FCGIRequest fcgiRequest) {
        long startTime = System.nanoTime();
        String queryString = fcgiRequest.params.getProperty("QUERY_STRING");
        Map<String, String> params = QueryParser.parse(queryString);
        ValidationResult validationResult = VALIDATOR.validate(params);
        if (!validationResult.isValid()){
            ResponseWriter.sendResponse(fcgiRequest, "400 Bad Request", JsonBuilder.errors(validationResult.errors()));
            return;
        }
        Point p = validationResult.point();
        boolean isHit = AreaChecker.isHit(p);
        long endTime = System.nanoTime();
        double ms = (endTime - startTime) / 1_000_000.0;
        String response = JsonBuilder.result(p,isHit,ms);
        ResponseWriter.sendResponse(fcgiRequest,"200 OK", response);
    }


}