package com.agrifarm;

import java.util.List;
import java.util.UUID;

public class Animal {
    public static final List<String> TYPES = List.of("Cow", "Buffalo", "Goat", "Sheep", "Chicken", "Duck");
    public static final List<String> STATUSES = List.of("Healthy", "Sick", "Sold");

    public String id = UUID.randomUUID().toString();
    public String tag, name, type = "Cow", breed = "", gender = "Female", birthDate = "", status = "Healthy", notes = "";
    public double weight;
    public boolean deleted;
}
