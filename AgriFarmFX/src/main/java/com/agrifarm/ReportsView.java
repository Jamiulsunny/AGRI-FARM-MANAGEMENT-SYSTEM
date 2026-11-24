package com.agrifarm;

import javafx.collections.FXCollections;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.chart.*;
import javafx.scene.control.Button;
import javafx.scene.layout.*;
import javafx.stage.FileChooser;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

public class ReportsView {
    public Node build() {
        DataStore ds = DataStore.get();
        List<Animal> live = ds.live();

        BarChart<String, Number> w = new BarChart<>(new CategoryAxis(), new NumberAxis());
        w.setLegendVisible(false);
        w.setPrefHeight(320);
        XYChart.Series<String, Number> s = new XYChart.Series<>();
        live.stream().collect(Collectors.groupingBy(a -> a.type, Collectors.averagingDouble(a -> a.weight)))
                .forEach((k, v) -> s.getData().add(new XYChart.Data<>(k, Math.round(v * 10) / 10.0)));
        w.getData().add(s);

        PieChart p = new PieChart(FXCollections.observableArrayList(
                live.stream().collect(Collectors.groupingBy(a -> a.status, Collectors.counting()))
                        .entrySet().stream().map(e -> new PieChart.Data(e.getKey() + " (" + e.getValue() + ")", e.getValue()))
                        .collect(Collectors.toList())));
        p.setPrefHeight(320);

        VBox c1 = Ui.card("Average Weight by Type (kg)", w), c2 = Ui.card("Animals by Status", p);
        HBox charts = new HBox(16, c1, c2);
        HBox.setHgrow(c1, Priority.ALWAYS);
        HBox.setHgrow(c2, Priority.ALWAYS);
        c1.setMaxWidth(Double.MAX_VALUE);
        c2.setMaxWidth(Double.MAX_VALUE);

        Button csv = Ui.btn("Export CSV", "fth-download", "btn-primary");
        csv.setOnAction(e -> SettingsView.exportCsv());
        HBox bar = new HBox(csv);
        bar.setAlignment(Pos.CENTER_RIGHT);
        return Ui.page("Reports", "Analytics of your livestock", bar, charts);
    }
}
