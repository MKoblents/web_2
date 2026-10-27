package org.example;

import com.fastcgi.FCGIInterface;
import com.fastcgi.FCGIRequest;
import org.example.http.Handler;
import org.example.store.ResultStore;
import org.example.validation.Validator;

import java.util.*;

public class Main {


    public static void main(String[] args){
        Validator validator = new Validator(-4, 4, -3, 3, Set.of(1.0, 1.5, 2.0, 2.5, 3.0));
        Handler handler = new Handler(validator, new ResultStore());
        FCGIInterface fcgiInterface = new FCGIInterface();
        while (fcgiInterface.FCGIaccept()>=0){
            FCGIRequest fcgiRequest = FCGIInterface.request;
            if (fcgiRequest == null || fcgiRequest.params == null || fcgiRequest.outStream == null) {
                continue;
            }
            handler.handle(fcgiRequest);
        }
    }

}