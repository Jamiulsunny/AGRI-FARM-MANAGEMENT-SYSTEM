package com.agrifarm;

import javafx.animation.FadeTransition;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.*;
import javafx.stage.Stage;
import javafx.util.Duration;
import org.kordamp.ikonli.javafx.FontIcon;

import java.util.function.Supplier;

public class MainApp extends Application {
    private final StackPane content = new StackPane();
    private final ToggleGroup group = new ToggleGroup();

    @Override
    public void start(Stage stage) {
        DataStore.get();
        VBox side = new VBox(6);
        side.getStyleClass().add("sidebar");
        side.setPrefWidth(240);
        FontIcon logo = new FontIcon("fth-feather");
        logo.getStyleClass().add("brand-icon");
        Label brand = new Label("AgriFarm", logo);
        brand.getStyleClass().add("brand");
        Label tag = new Label("Livestock Management");
        tag.getStyleClass().add("brand-sub");
        side.getChildren().addAll(new VBox(2, brand, tag));
        VBox.setMargin(side.getChildren().get(0), new Insets(0, 0, 24, 0));

        ToggleButton first = nav(side, "Dashboard", "fth-home", () -> new DashboardView().build());
        nav(side, "Animals", "fth-list", () -> new AnimalsView().build());
        nav(side, "Health", "fth-heart", () -> new HealthView().build());
        nav(side, "Reports", "fth-bar-chart-2", () -> new ReportsView().build());
        nav(side, "Settings", "fth-settings", () -> new SettingsView().build());
        first.setSelected(true);
        show(new DashboardView().build());

        BorderPane root = new BorderPane(content);
        root.setLeft(side);
        Scene scene = new Scene(root, 1280, 800);
        scene.getStylesheets().add(Ui.css());
        stage.setTitle("Agri Farm Management System");
        stage.setMinWidth(1000);
        stage.setMinHeight(650);
        stage.setScene(scene);
        stage.show();
    }

    private ToggleButton nav(VBox side, String text, String icon, Supplier<Node> view) {
        ToggleButton b = new ToggleButton(text, new FontIcon(icon));
        b.getStyleClass().add("nav-btn");
        b.setToggleGroup(group);
        b.setMaxWidth(Double.MAX_VALUE);
        b.setAlignment(Pos.CENTER_LEFT);
        b.setOnAction(e -> { if (!b.isSelected()) b.setSelected(true); show(view.get()); });
        side.getChildren().add(b);
        return b;
    }

    private void show(Node n) {
        content.getChildren().setAll(n);
        FadeTransition ft = new FadeTransition(Duration.millis(250), n);
        ft.setFromValue(0);
        ft.setToValue(1);
        ft.play();
    }

    public static void main(String[] args) { launch(args); }
}
