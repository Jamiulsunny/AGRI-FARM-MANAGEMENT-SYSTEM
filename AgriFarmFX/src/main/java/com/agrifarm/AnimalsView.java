package com.agrifarm;

import javafx.collections.FXCollections;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.*;

import java.time.LocalDate;
import java.util.List;
import java.util.function.Function;

public class AnimalsView {
    private final DataStore ds = DataStore.get();
    private final TableView<Animal> table = new TableView<>();
    private final TextField search = new TextField();
    private final ComboBox<String> typeBox = new ComboBox<>();
    private final CheckBox trash = new CheckBox("Show deleted");

    public Node build() {
        search.setPromptText("Search tag, name, breed...");
        search.getStyleClass().add("search");
        search.setPrefWidth(280);
        typeBox.getItems().add("All Types");
        typeBox.getItems().addAll(Animal.TYPES);
        typeBox.setValue("All Types");
        Button add = Ui.btn("Add Animal", "fth-plus", "btn-primary");
        add.setOnAction(e -> form(null));
        search.textProperty().addListener((o, a, b) -> refresh());
        typeBox.setOnAction(e -> refresh());
        trash.setOnAction(e -> refresh());
        Region sp = new Region();
        HBox.setHgrow(sp, Priority.ALWAYS);
        HBox bar = new HBox(12, search, typeBox, trash, sp, add);
        bar.setAlignment(Pos.CENTER_LEFT);

        table.getColumns().addAll(List.of(col("Tag", a -> a.tag), col("Name", a -> a.name), col("Type", a -> a.type),
                col("Breed", a -> a.breed), col("Gender", a -> a.gender), col("Weight (kg)", a -> String.valueOf(a.weight)),
                statusCol(), actionCol()));
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        table.setPlaceholder(new Label("No animals found"));
        table.setPrefHeight(520);
        refresh();
        return Ui.page("Animals", "Manage your livestock records", bar, Ui.card(null, table));
    }

    private TableColumn<Animal, String> col(String name, Function<Animal, String> f) {
        TableColumn<Animal, String> c = new TableColumn<>(name);
        c.setCellValueFactory(d -> new javafx.beans.property.SimpleStringProperty(f.apply(d.getValue())));
        return c;
    }

    private TableColumn<Animal, String> statusCol() {
        TableColumn<Animal, String> c = col("Status", a -> a.status);
        c.setCellFactory(x -> new TableCell<>() {
            @Override protected void updateItem(String s, boolean empty) {
                super.updateItem(s, empty);
                if (empty || s == null) { setGraphic(null); return; }
                Label b = new Label(s);
                b.getStyleClass().addAll("badge", "badge-" + s.toLowerCase());
                setGraphic(b);
            }
        });
        return c;
    }

    private TableColumn<Animal, Void> actionCol() {
        TableColumn<Animal, Void> c = new TableColumn<>("Actions");
        c.setCellFactory(x -> new TableCell<>() {
            final Button ed = Ui.btn(null, "fth-edit-2", "btn-icon");
            final Button del = Ui.btn(null, "fth-trash-2", "btn-icon-danger");
            final Button res = Ui.btn(null, "fth-rotate-ccw", "btn-icon");
            final HBox box = new HBox(6);
            @Override protected void updateItem(Void v, boolean empty) {
                super.updateItem(v, empty);
                if (empty || getIndex() >= getTableView().getItems().size()) { setGraphic(null); return; }
                Animal a = getTableView().getItems().get(getIndex());
                box.getChildren().setAll(a.deleted ? List.of(res) : List.of(ed, del));
                ed.setOnAction(e -> form(a));
                del.setOnAction(e -> { if (Ui.confirm("Move " + a.name + " to trash?")) { a.deleted = true; ds.save(); refresh(); } });
                res.setOnAction(e -> { a.deleted = false; ds.save(); refresh(); });
                setGraphic(box);
            }
        });
        return c;
    }

    private void refresh() {
        String q = search.getText() == null ? "" : search.getText().toLowerCase();
        String t = typeBox.getValue();
        table.setItems(FXCollections.observableArrayList(ds.animals.stream()
                .filter(a -> a.deleted == trash.isSelected())
                .filter(a -> t == null || t.equals("All Types") || a.type.equals(t))
                .filter(a -> (a.tag + a.name + a.breed).toLowerCase().contains(q))
                .toList()));
    }

    private void form(Animal existing) {
        boolean isNew = existing == null;
        Animal a = isNew ? new Animal() : existing;
        TextField tag = new TextField(isNew ? "" : a.tag), name = new TextField(isNew ? "" : a.name),
                breed = new TextField(a.breed), weight = new TextField(a.weight == 0 ? "" : String.valueOf(a.weight));
        ComboBox<String> type = new ComboBox<>(FXCollections.observableArrayList(Animal.TYPES));
        ComboBox<String> gender = new ComboBox<>(FXCollections.observableArrayList("Female", "Male"));
        ComboBox<String> status = new ComboBox<>(FXCollections.observableArrayList(Animal.STATUSES));
        type.setValue(a.type); gender.setValue(a.gender); status.setValue(a.status);
        DatePicker dob = new DatePicker(a.birthDate.isEmpty() ? null : LocalDate.parse(a.birthDate));
        TextArea notes = new TextArea(a.notes);
        notes.setPrefRowCount(3);

        GridPane g = new GridPane();
        g.setHgap(14); g.setVgap(12); g.setPadding(new Insets(10));
        String[] labels = {"Tag *", "Name *", "Type", "Breed", "Gender", "Weight (kg)", "Birth date", "Status", "Notes"};
        Node[] fields = {tag, name, type, breed, gender, weight, dob, status, notes};
        for (int i = 0; i < labels.length; i++) {
            g.add(new Label(labels[i]), 0, i);
            g.add(fields[i], 1, i);
            if (fields[i] instanceof Region r) r.setPrefWidth(260);
        }
        Dialog<ButtonType> d = new Dialog<>();
        d.setTitle(isNew ? "Add Animal" : "Edit Animal");
        d.getDialogPane().setContent(g);
        d.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        d.getDialogPane().getStylesheets().add(Ui.css());
        d.getDialogPane().lookupButton(ButtonType.OK).addEventFilter(ActionEvent.ACTION, ev -> {
            String err = null;
            if (tag.getText().isBlank() || name.getText().isBlank()) err = "Tag and Name are required.";
            else if (ds.tagExists(tag.getText().trim(), isNew ? null : a)) err = "This tag already exists.";
            else if (!weight.getText().isBlank()) {
                try { if (Double.parseDouble(weight.getText()) < 0) err = "Weight cannot be negative."; }
                catch (NumberFormatException ex) { err = "Weight must be a number."; }
            }
            if (err != null) { ev.consume(); Ui.error(err); }
        });
        if (d.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.OK) return;
        a.tag = tag.getText().trim(); a.name = name.getText().trim(); a.type = type.getValue();
        a.breed = breed.getText().trim(); a.gender = gender.getValue(); a.status = status.getValue();
        a.weight = weight.getText().isBlank() ? 0 : Double.parseDouble(weight.getText());
        a.birthDate = dob.getValue() == null ? "" : dob.getValue().toString();
        a.notes = notes.getText();
        if (isNew) ds.animals.add(a);
        ds.save();
        refresh();
    }
}
