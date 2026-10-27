package org.example.store;

import org.example.models.CheckResult;
import java.util.ArrayList;
import java.util.List;

public class ResultStore {
    private final List<CheckResult> results = new ArrayList<>();

    public synchronized void add(CheckResult r) {
        results.add(r);
    }

    public synchronized List<CheckResult> list() {
        return List.copyOf(results);
    }

    public synchronized void clear() {
        results.clear();
    }
}