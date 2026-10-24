package org.example.logic;

import org.example.models.Point;

public final class AreaChecker {
    private AreaChecker() {}

    public static boolean isHit(Point p) {
        double x = p.x(), y = p.y(), r = p.r();
        boolean inRectangle = (x >= -r && x <= 0) && (y >= -r && y <= 0);
        boolean inTriangle = (x >= -r && x <= 0) && (y >= 0) && (y <= x / 2 + r / 2);
        boolean inCircle = (x >= 0 && x <= r) && (y >= 0 && y <= r) && (x * x + y * y <= r * r);
        return inRectangle || inTriangle || inCircle;
    }
}