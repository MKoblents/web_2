package org.example.models;

import java.time.Instant;

public record CheckResult(Point point, boolean hit, Instant checkedAt, double executionMs) {}