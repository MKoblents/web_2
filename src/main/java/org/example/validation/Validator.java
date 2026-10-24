package org.example.validation;

import org.example.models.Point;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Validator {
    private final double minX, maxX, minY, maxY;
    private final Set<Double> allowedR;

    public Validator(double minX, double maxX, double minY, double maxY, Set<Double> allowedR) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
        this.allowedR = allowedR;
    }

    public ValidationResult validate(Map<String, String> params) {
        List<String> errors = new ArrayList<>();

        Double x = parseInRange("x", params.get("x"), minX, maxX, errors);
        Double y = parseInRange("y", params.get("y"), minY, maxY, errors);
        Double r = parse("r", params.get("r"), errors);
        if (r != null && !allowedR.contains(r)) {
            errors.add("r must be one of " + allowedR);
            r = null;
        }
        if (!errors.isEmpty()) {
            return new ValidationResult(errors, null);
        }
        return new ValidationResult(errors, new Point(x, y, r));
    }

    private Double parseInRange(String name, String raw, double min, double max, List<String> errors) {
        Double v = parse(name, raw, errors);
        if (v != null && (v < min || v > max)) {
            errors.add(name + " must be in [" + min + "; " + max + "]");
            return null;
        }
        return v;
    }

    private Double parse(String name, String raw, List<String> errors) {
        if (raw == null || raw.isBlank()) {
            errors.add("Missing parameter: " + name);
            return null;
        }
        try {
            double v = Double.parseDouble(raw.trim());
            if (!Double.isFinite(v)) {
                errors.add(name + " must be a finite number");
                return null;
            }
            return v;
        } catch (NumberFormatException e) {
            errors.add(name + " must be a number");
            return null;
        }
    }
}