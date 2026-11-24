package com.agrifarm;

import javafx.geometry.Insets;
import javafx.scene.Node;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import org.kordamp.ikonli.javafx.FontIcon;

public class Ui {
    public static String css() { return Ui.class.getResource("/styles.css").toExternalForm(); }

    public static Button btn(String text, String icon, String style) {
        Button b = new Button(text, icon == null ? null : new FontIcon(icon));
        b.getStyleClass().add(style);
        return b;
    }

    public static VBox card(String title, Node body) {
        VBox c = new VBox(12);
        c.getStyleClass().add("card");
        if (title != null) {
            Label l = new Label(title);
            l.getStyleClass().add("card-title");
            c.getChildren().add(l);
        }
        c.getChildren().add(body);
        VBox.setVgrow(body, Priority.ALWAYS);
        return c;
    }

    public static VBox stat(String icon, String label, String value, String color) {
        FontIcon fi = new FontIcon(icon);
        fi.getStyleClass().add("stat-icon");
        StackPane badge = new StackPane(fi);
        badge.getStyleClass().addAll("stat-badge", color);
        Label v = new Label(value); v.getStyleClass().add("stat-value");
        Label l = new Label(label); l.getStyleClass().add("stat-label");
        HBox row = new HBox(14, badge, new VBox(2, v, l));
        VBox box = new VBox(row);
        box.getStyleClass().add("card");
        HBox.setHgrow(box, Priority.ALWAYS);
        box.setMaxWidth(Double.MAX_VALUE);
        return box;
    }

    public static ScrollPane page(String title, String sub, Node... nodes) {
        Label t = new Label(title); t.getStyleClass().add("page-title");
        Label s = new Label(sub); s.getStyleClass().add("page-sub");
        VBox box = new VBox(20, new VBox(2, t, s));
        box.getChildren().addAll(nodes);
        box.setPadding(new Insets(28));
        ScrollPane sp = new ScrollPane(box);
        sp.setFitToWidth(true);
        sp.getStyleClass().add("page-scroll");
        return sp;
    }

    public static void error(String m) {
        Alert a = new Alert(Alert.AlertType.WARNING, m);
        a.getDialogPane().getStylesheets().add(css());
        a.showAndWait();
    }

    public static boolean confirm(String m) {
        Alert a = new Alert(Alert.AlertType.CONFIRMATION, m, ButtonType.YES, ButtonType.NO);
        a.getDialogPane().getStylesheets().add(css());
        return a.showAndWait().orElse(ButtonType.NO) == ButtonType.YES;
    }
}
