{
    // Create UI Window
    var mainWindow = new Window("palette", "Simple AE Script", undefined);
    mainWindow.orientation = "column";

    // Add a button to apply changes
    var applyBtn = mainWindow.add("button", undefined, "Apply Opacity");
    
    // Add a slider to control opacity
    var opacitySlider = mainWindow.add("slider", undefined, 100, 0, 100);
    opacitySlider.size = [200, 30];

    // Add static text label for the slider
    var opacityLabel = mainWindow.add("statictext", undefined, "Opacity: 100%");
    
    // Show UI
    mainWindow.center();
    mainWindow.show();

    // Event listener to update the label when the slider moves
    opacitySlider.onChanging = function() {
        opacityLabel.text = "Opacity: " + Math.round(opacitySlider.value) + "%";
    };

    // Event listener for the Apply button
    applyBtn.onClick = function() {
        // Check if a composition is open
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            var selectedLayers = comp.selectedLayers;

            if (selectedLayers.length > 0) {
                // Apply opacity to all selected layers
                app.beginUndoGroup("Apply Opacity");
                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    // Apply opacity to the selected layer(s)
                    layer.opacity.setValue(opacitySlider.value);
                }
                app.endUndoGroup();
                alert("Opacity applied successfully!");
            } else {
                alert("Please select a layer.");
            }
        } else {
            alert("Please open a composition first.");
        }
    };
}
