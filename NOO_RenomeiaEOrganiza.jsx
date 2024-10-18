// RenameAndSortLayers.jsx
// This script renames and sorts selected layers in the active composition based on their X or Y position.

(function renameAndSortLayers() {
    // Ensure a project is open
    if (!app.project) {
        alert("No project is open.");
        return;
    }

    var proj = app.project;
    var activeItem = proj.activeItem;

    // Ensure the active item is a composition
    if (!(activeItem && activeItem instanceof CompItem)) {
        alert("Please select or open a composition.");
        return;
    }

    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select at least one layer to rename and sort.");
        return;
    }

    // Create a ScriptUI window
    var dialog = new Window("dialog", "Rename and Sort Layers");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    dialog.spacing = 10;
    dialog.margins = 15;

    // Base Name Input Group
    var baseNameGroup = dialog.add("group");
    baseNameGroup.orientation = "row";
    baseNameGroup.alignChildren = ["left", "center"];
    baseNameGroup.spacing = 10;

    baseNameGroup.add("statictext", undefined, "Base Name:");
    var baseNameInput = baseNameGroup.add("edittext", undefined, "Layer");
    baseNameInput.characters = 20;
    baseNameInput.active = true;

    // First Separator
    var separator1 = dialog.add("panel", undefined, "");
    separator1.orientation = "row";
    separator1.alignment = ["fill", "center"];
    separator1.borderStyle = "sunken";
    separator1.preferredSize.height = 2;

    // Sorting Options
    var sortText = dialog.add("statictext", undefined, "Sort Layers By:");
    sortText.alignment = ["left", "top"];

    var sortGroup = dialog.add("group");
    sortGroup.orientation = "row";
    sortGroup.alignChildren = ["left", "center"];
    sortGroup.spacing = 20;

    var sortX = sortGroup.add("radiobutton", undefined, "X Position");
    sortX.value = true; // Default selection
    var sortY = sortGroup.add("radiobutton", undefined, "Y Position");

    // Second Separator
    var separator2 = dialog.add("panel", undefined, "");
    separator2.orientation = "row";
    separator2.alignment = ["fill", "center"];
    separator2.borderStyle = "sunken";
    separator2.preferredSize.height = 2;

    // Buttons Group
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignChildren = ["center", "center"];
    buttonGroup.spacing = 20;

    buttonGroup.add("button", undefined, "OK", { name: "ok" });
    buttonGroup.add("button", undefined, "Cancel", { name: "cancel" });

    // Handle Cancel button
    buttonGroup.children[1].onClick = function () {
        dialog.close();
    };

    // Handle OK button
    buttonGroup.children[0].onClick = function () {
        var baseName = baseNameInput.text.trim();
        if (baseName === "") {
            alert("Base name cannot be empty.");
            return;
        }

        var sortBy = sortX.value ? "x" : "y";

        app.beginUndoGroup("Rename and Sort Selected Layers");

        // Gather layer positions
        var layerData = [];
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var position = layer.property("Position");
            if (position) {
                var posValue = position.value;
                layerData.push({
                    layer: layer,
                    value: sortBy === "x" ? posValue[0] : posValue[1],
                    originalIndex: layer.index
                });
            } else {
                // If layer has no position property, assign a default value
                layerData.push({
                    layer: layer,
                    value: 0,
                    originalIndex: layer.index
                });
            }
        }

        // Sort the layerData based on the chosen dimension
        layerData.sort(function (a, b) {
            return a.value - b.value;
        });

        // Determine the number of digits for numbering
        var totalLayers = layerData.length;
        var digits = Math.max(2, String(totalLayers).length);

        // Rename layers
        for (var j = 0; j < layerData.length; j++) {
            var currentLayer = layerData[j].layer;
            var number = (j + 1).toString();
            while (number.length < digits) {
                number = "0" + number;
            }
            currentLayer.name = baseName + "_" + number;
        }

        // Rearrange layer stacking order
        // To maintain the sorted order in the layer stack, we'll move layers to the top in reverse sorted order
        for (var k = layerData.length - 1; k >= 0; k--) {
            var layerToMove = layerData[k].layer;
            layerToMove.moveToBeginning();
        }

        app.endUndoGroup();

        alert("Renamed and sorted " + totalLayers + " layer(s) by " + (sortBy === "x" ? "X" : "Y") + " position.");
        dialog.close();
    };

    // Show the dialog
    dialog.center();
    dialog.show();
})();
