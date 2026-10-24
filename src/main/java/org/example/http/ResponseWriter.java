package org.example.http;

import com.fastcgi.FCGIRequest;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class ResponseWriter {
    public static void sendResponse(FCGIRequest req, String status, String body) {
        try {
            String full = "Status: " + status + "\r\n"
                    + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + body;
            req.outStream.write(full.getBytes(StandardCharsets.UTF_8));
            req.outStream.flush();
        } catch (IOException e) {
            System.err.println("[ERROR] Ошибка записи: " + e.getMessage());
        }
    }
}
