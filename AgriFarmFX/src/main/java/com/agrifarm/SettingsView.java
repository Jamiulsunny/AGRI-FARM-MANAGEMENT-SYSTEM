package com.agrifarm;

import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;

import java.io.File;

public class SettingsView {
    private static File pick(boolean save, String desc, String ext, String name) {
        FileChooser fc = new FileChooser();
        fc.getExtensionFilters().add(new FileChooser.ExtensionFilter(desc, "*." + ext));
        fc.setInitialFileName(name);
        return save ? fc.showSaveDialog(null) : fc.showOpenDialog(null);
    }

    public static void exportCsv() {
        File f = pick(true, "CSV", "csv", "animals.csv");
        if (f == null) return;
        try { DataStore.get().exportCsv(f.toPath()); }
        catch (Exception ex) { Ui.error("Export failed: " + ex.getMessage()); }
    }

    public Node build() {
        DataStore ds = DataStore.get();
        Button backup = Ui.btn("Backup (JSON)", "fth-download", "btn-primary");
        backup.setOnAction(e -> {
            File f = pick(true, "JSON", "json", "agrifarm-backup.json");
            if (f == null) return;
            try { ds.writeTo(f.toPath()); } catch (Exception ex) { Ui.error("Backup failed: " + ex.getMessage()); }
        });
        Button restore = Ui.btn("Restore (JSON)", "fth-upload", "btn-secondary");
        restore.setOnAction(e -> {
            File f = pick(false, "JSON", "json", "");
            if (f == null || !Ui.confirm("Replace all current data with this backup?")) return;
            try { ds.importFrom(f.toPath()); } catch (Exception ex) { Ui.error("Restore failed: " + ex.getMessage()); }
        });
        Button csv = Ui.btn("Export Animals (CSV)", "fth-file-text", "btn-secondary");
        csv.setOnAction(e -> exportCsv());
        Button reset = Ui.btn("Reset to Sample Data", "fth-refresh-cw", "btn-danger");
        reset.setOnAction(e -> { if (Ui.confirm("This deletes all your data. Continue?")) ds.reset(); });

        Label info = new Label("Data is stored locally at: " + System.getProperty("user.home") + "/.agrifarm/data.json");
        info.getStyleClass().add("page-sub");
        return Ui.page("Settings", "Backup, restore and data tools",
                Ui.card("Backup & Restore", new VBox(12, backup, restore, csv)),
                Ui.card("Danger Zone", new VBox(12, reset, info)));
    }
}
