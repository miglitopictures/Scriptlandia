// RenameSelectedLayers.jsx
// This script renames all selected layers in the active composition by appending a sequential number to a base name.

(function renameSelectedLayers() {
    // Get the active project
    var proj = app.project;
    if (!proj) {
        alert("No project is open.");
        return;
    }

    // Get the active item (should be a composition)
    var activeItem = proj.activeItem;
    if (!(activeItem && activeItem instanceof CompItem)) {
        alert("Please select or open a composition.");
        return;
    }

    // Get selected layers
    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select at least one layer to rename.");
        return;
    }

    // Prompt user for base name
    var baseName = prompt("Enter the base name for the selected layers:", "Layer");
    if (baseName === null) {
        // User canceled the prompt
        return;
    }
    baseName = baseName.trim();
    if (baseName === "") {
        alert("Base name cannot be empty.");
        return;
    }

    // Begin undo group
    app.beginUndoGroup("Rename Selected Layers");

    // Determine the number of digits needed for numbering (e.g., 01, 02, ..., 10, etc.)
    var totalLayers = selectedLayers.length;
    var digits = Math.max(2, String(totalLayers).length);

    // Sort layers in the order they appear in the timeline (optional)
    selectedLayers.sort(function(a, b) {
        return a.index - b.index;
    });

    // Rename each selected layer
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var number = (i + 1).toString();
        while (number.length < digits) {
            number = "0" + number;
        }
        layer.name = baseName + "_" + number;
    }

    // End undo group
    app.endUndoGroup();

    alert("Renamed " + selectedLayers.length + " layer(s) to \"" + baseName + "_XX\" format.");
})();
