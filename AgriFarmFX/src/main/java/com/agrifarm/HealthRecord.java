package com.agrifarm;

import java.util.List;
import java.util.UUID;

public class HealthRecord {
    public static final List<String> KINDS = List.of("Vaccination", "Treatment", "Checkup", "Deworming");

    public String id = UUID.randomUUID().toString();
    public String animalId, date, kind = "Checkup", note = "";
}
