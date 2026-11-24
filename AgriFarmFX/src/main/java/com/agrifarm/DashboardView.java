package com.agrifarm;

import javafx.collections.FXCollections;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.chart.*;
import javafx.scene.control.Label;
import javafx.scene.layout.*;
import org.kordamp.ikonli.javafx.FontIcon;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DashboardView {
    public Node build() {
        DataStore ds = DataStore.get();
        List<Animal> live = ds.live();
        long healthy = live.stream().filter(a -> a.status.equals("Healthy")).count();
        long sick = live.stream().filter(a -> a.status.equals("Sick")).count();
        long sold = live.stream().filter(a -> a.status.equals("Sold")).count();

        HBox stats = new HBox(16,
                Ui.stat("fth-layers", "Total Animals", String.valueOf(live.size()), "c-green"),
                Ui.stat("fth-check-circle", "Healthy", String.valueOf(healthy), "c-teal"),
                Ui.stat("fth-alert-triangle", "Sick", String.valueOf(sick), "c-red"),
                Ui.stat("fth-tag", "Sold", String.valueOf(sold), "c-amber"));

        PieChart pie = new PieChart(FXCollections.observableArrayList(
                live.stream().collect(Collectors.groupingBy(a -> a.type, Collectors.counting()))
                        .entrySet().stream().map(e -> new PieChart.Data(e.getKey() + " (" + e.getValue() + ")", e.getValue()))
                        .collect(Collectors.toList())));
        pie.setLegendSide(javafx.geometry.Side.BOTTOM);
        pie.setPrefHeight(300);

        BarChart<String, Number> bar = new BarChart<>(new CategoryAxis(), new NumberAxis());
        bar.setLegendVisible(false);
        bar.setPrefHeight(300);
        XYChart.Series<String, Number> s = new XYChart.Series<>();
        Map<String, Long> kinds = ds.records.stream().collect(Collectors.groupingBy(r -> r.kind, Collectors.counting()));
        kinds.forEach((k, v) -> s.getData().add(new XYChart.Data<>(k, v)));
        bar.getData().add(s);

        VBox recent = new VBox(10);
        ds.records.stream().sorted(Comparator.comparing((HealthRecord r) -> r.date).reversed()).limit(5).forEach(r -> {
            Animal a = ds.find(r.animalId);
            Label l = new Label(r.kind + " — " + (a == null ? "?" : a.name) + "   ·   " + r.date, new FontIcon("fth-activity"));
            l.getStyleClass().add("list-row");
            recent.getChildren().add(l);
        });
        if (recent.getChildren().isEmpty()) recent.getChildren().add(new Label("No health records yet"));

        VBox c1 = Ui.card("Animals by Type", pie), c2 = Ui.card("Health Activity", bar);
        HBox charts = new HBox(16, c1, c2);
        HBox.setHgrow(c1, Priority.ALWAYS);
        HBox.setHgrow(c2, Priority.ALWAYS);
        c1.setMaxWidth(Double.MAX_VALUE);
        c2.setMaxWidth(Double.MAX_VALUE);
        return Ui.page("Dashboard", "Overview of your farm", stats, charts, Ui.card("Recent Health Records", recent));
    }
}
