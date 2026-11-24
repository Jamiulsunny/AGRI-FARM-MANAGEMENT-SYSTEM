package com.agrifarm;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Service layer: JSON file persistence in ~/.agrifarm/data.json */
public class DataStore {
    private static final DataStore INSTANCE = new DataStore();
    public static DataStore get() { return INSTANCE; }

    static class Snapshot { List<Animal> animals; List<HealthRecord> records; }

    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private final Path file = Path.of(System.getProperty("user.home"), ".agrifarm", "data.json");
    public final ObservableList<Animal> animals = FXCollections.observableArrayList();
    public final ObservableList<HealthRecord> records = FXCollections.observableArrayList();

    private DataStore() {
        try {
            if (Files.exists(file)) { readFrom(file); return; }
        } catch (Exception ignored) { }
        reset();
    }

    private void readFrom(Path p) throws IOException {
        Snapshot s = gson.fromJson(Files.readString(p), Snapshot.class);
        if (s == null || s.animals == null) throw new IOException("Invalid backup file");
        animals.setAll(s.animals);
        records.setAll(s.records == null ? new ArrayList<>() : s.records);
    }

    public void writeTo(Path p) throws IOException {
        Snapshot s = new Snapshot();
        s.animals = new ArrayList<>(animals);
        s.records = new ArrayList<>(records);
        Files.writeString(p, gson.toJson(s));
    }

    public void save() {
        try { Files.createDirectories(file.getParent()); writeTo(file); }
        catch (IOException e) { e.printStackTrace(); }
    }

    public void importFrom(Path p) throws IOException { readFrom(p); save(); }

    public void exportCsv(Path p) throws IOException {
        StringBuilder sb = new StringBuilder("Tag,Name,Type,Breed,Gender,Weight(kg),BirthDate,Status,Notes\n");
        for (Animal a : animals) {
            if (a.deleted) continue;
            sb.append(String.join(",", q(a.tag), q(a.name), q(a.type), q(a.breed), q(a.gender),
                    String.valueOf(a.weight), q(a.birthDate), q(a.status), q(a.notes))).append("\n");
        }
        Files.writeString(p, sb.toString());
    }
    private String q(String s) { return "\"" + (s == null ? "" : s.replace("\"", "\"\"")) + "\""; }

    public List<Animal> live() { return animals.stream().filter(a -> !a.deleted).collect(Collectors.toList()); }

    public Animal find(String id) {
        return animals.stream().filter(a -> a.id.equals(id)).findFirst().orElse(null);
    }

    public boolean tagExists(String tag, Animal except) {
        return animals.stream().anyMatch(a -> a != except && a.tag.equalsIgnoreCase(tag));
    }

    public void reset() {
        animals.clear(); records.clear();
        String[][] d = {
            {"C-001", "Lakshmi", "Cow", "Holstein", "Female", "420", "2021-03-12", "Healthy"},
            {"C-002", "Bholu", "Cow", "Sahiwal", "Male", "480", "2020-07-01", "Healthy"},
            {"B-001", "Kalu", "Buffalo", "Murrah", "Male", "560", "2019-11-20", "Sick"},
            {"G-001", "Moti", "Goat", "Black Bengal", "Female", "28", "2023-01-15", "Healthy"},
            {"G-002", "Chhoto", "Goat", "Jamunapari", "Male", "35", "2022-09-09", "Healthy"},
            {"S-001", "Dhabal", "Sheep", "Garole", "Female", "32", "2022-05-30", "Sold"},
            {"H-001", "Murgi-1", "Chicken", "Sonali", "Female", "2", "2024-02-02", "Healthy"},
            {"D-001", "Hans-1", "Duck", "Khaki Campbell", "Female", "3", "2024-01-10", "Healthy"}};
        for (String[] r : d) {
            Animal a = new Animal();
            a.tag = r[0]; a.name = r[1]; a.type = r[2]; a.breed = r[3]; a.gender = r[4];
            a.weight = Double.parseDouble(r[5]); a.birthDate = r[6]; a.status = r[7];
            animals.add(a);
        }
        String[] kinds = {"Vaccination", "Treatment", "Checkup", "Deworming", "Vaccination"};
        for (int i = 0; i < kinds.length; i++) {
            HealthRecord h = new HealthRecord();
            h.animalId = animals.get(i).id; h.kind = kinds[i];
            h.date = LocalDate.now().minusDays(i * 6L + 1).toString();
            h.note = kinds[i] + " completed";
            records.add(h);
        }
        save();
    }
}
