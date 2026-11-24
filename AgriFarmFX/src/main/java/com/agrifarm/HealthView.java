package com.agrifarm;

import javafx.collections.FXCollections;
import javafx.event.ActionEvent;
import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.util.StringConverter;

import java.time.LocalDate;
import java.util.Comparator;

public class HealthView {
    private final DataStore ds = DataStore.get();
    private final TableView<HealthRecord> table = new TableView<>();

    public Node build() {
        Button add = Ui.btn("Add Record", "fth-plus", "btn-primary");
        add.setOnAction(e -> form());
        HBox bar = new HBox(add);
        bar.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);

        TableColumn<HealthRecord, String> d = new TableColumn<>("Date");
        d.setCellValueFactory(c -> new javafx.beans.property.SimpleStringProperty(c.getValue().date));
        TableColumn<HealthRecord, String> an = new TableColumn<>("Animal");
        an.setCellValueFactory(c -> {
            Animal a = ds.find(c.getValue().animalId);
            return new javafx.beans.property.SimpleStringProperty(a == null ? "(removed)" : a.tag + " – " + a.name);
        });
        TableColumn<HealthRecord, String> k = new TableColumn<>("Type");
        k.setCellValueFactory(c -> new javafx.beans.property.SimpleStringProperty(c.getValue().kind));
        TableColumn<HealthRecord, String> n = new TableColumn<>("Note");
        n.setCellValueFactory(c -> new javafx.beans.property.SimpleStringProperty(c.getValue().note));
        TableColumn<HealthRecord, Void> act = new TableColumn<>("");
        act.setCellFactory(x -> new TableCell<>() {
            final Button del = Ui.btn(null, "fth-trash-2", "btn-icon-danger");
            @Override protected void updateItem(Void v, boolean empty) {
                super.updateItem(v, empty);
                if (empty || getIndex() >= getTableView().getItems().size()) { setGraphic(null); return; }
                HealthRecord r = getTableView().getItems().get(getIndex());
                del.setOnAction(e -> { if (Ui.confirm("Delete this record?")) { ds.records.remove(r); ds.save(); refresh(); } });
                setGraphic(del);
            }
        });
        table.getColumns().addAll(java.util.List.of(d, an, k, n, act));
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        table.setPlaceholder(new Label("No health records"));
        table.setPrefHeight(520);
        refresh();
        return Ui.page("Health", "Vaccinations, treatments and check-ups", bar, Ui.card(null, table));
    }

    private void refresh() {
        table.setItems(FXCollections.observableArrayList(
                ds.records.stream().sorted(Comparator.comparing((HealthRecord r) -> r.date).reversed()).toList()));
    }

    private void form() {
        ComboBox<Animal> animal = new ComboBox<>(FXCollections.observableArrayList(ds.live()));
        animal.setConverter(new StringConverter<>() {
            @Override public String toString(Animal a) { return a == null ? "" : a.tag + " – " + a.name; }
            @Override public Animal fromString(String s) { return null; }
        });
        DatePicker date = new DatePicker(LocalDate.now());
        ComboBox<String> kind = new ComboBox<>(FXCollections.observableArrayList(HealthRecord.KINDS));
        kind.setValue("Checkup");
        TextArea note = new TextArea();
        note.setPrefRowCount(3);
        GridPane g = new GridPane();
        g.setHgap(14); g.setVgap(12); g.setPadding(new Insets(10));
        g.addRow(0, new Label("Animal *"), animal);
        g.addRow(1, new Label("Date"), date);
        g.addRow(2, new Label("Type"), kind);
        g.addRow(3, new Label("Note"), note);
        Dialog<ButtonType> dlg = new Dialog<>();
        dlg.setTitle("Add Health Record");
        dlg.getDialogPane().setContent(g);
        dlg.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        dlg.getDialogPane().getStylesheets().add(Ui.css());
        dlg.getDialogPane().lookupButton(ButtonType.OK).addEventFilter(ActionEvent.ACTION, ev -> {
            if (animal.getValue() == null || date.getValue() == null) { ev.consume(); Ui.error("Select an animal and a date."); }
        });
        if (dlg.showAndWait().orElse(ButtonType.CANCEL) != ButtonType.OK) return;
        HealthRecord r = new HealthRecord();
        r.animalId = animal.getValue().id; r.date = date.getValue().toString(); r.kind = kind.getValue(); r.note = note.getText();
        ds.records.add(r);
        ds.save();
        refresh();
    }
}
