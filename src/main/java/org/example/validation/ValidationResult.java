package org.example.validation;

import org.example.models.Point;
import java.util.List;

public record ValidationResult(List<String> errors, Point point) {
    public boolean isValid() {
        return errors.isEmpty();
    }
}