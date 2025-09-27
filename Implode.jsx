// Script to merge selected shape layers into a single shape layer

function mergeSelectedShapeLayers() {
    var comp = app.project.activeItem;

    if (comp && comp instanceof CompItem) {
        app.beginUndoGroup("Merge Shape Layers");

        var selectedLayers = comp.selectedLayers;

        if (selectedLayers.length < 2) {
            alert("Please select at least two shape layers.");
            app.endUndoGroup();
            return;
        }

        // Ensure all selected layers are shape layers
        for (var i = 0; i < selectedLayers.length; i++) {
            if (!(selectedLayers[i] instanceof ShapeLayer)) {
                alert("Please select only shape layers.");
                app.endUndoGroup();
                return;
            }
        }

        // Create a new shape layer to merge into
        var newShapeLayer = comp.layers.addShape();
        newShapeLayer.name = "Merged Shape Layer";

        var targetContents = newShapeLayer.property("ADBE Root Vectors Group");

        // For each selected layer, copy its contents into the new shape layer
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var shapeContents = layer.property("ADBE Root Vectors Group");

            // Deselect all properties
            app.executeCommand(app.findMenuCommandId("Deselect All"));

            // Copy each group from shapeContents to targetContents
            for (var j = 1; j <= shapeContents.numProperties; j++) {
                var shapeGroup = shapeContents.property(j);

                // Select the shapeGroup
                shapeGroup.selected = true;

                // Copy
                app.executeCommand(app.findMenuCommandId("Copy"));

                // Deselect the shapeGroup
                shapeGroup.selected = false;

                // Select the target layer's contents
                app.executeCommand(app.findMenuCommandId("Deselect All"));
                newShapeLayer.selected = true;
                targetContents.selected = true;

                // Paste
                app.executeCommand(app.findMenuCommandId("Paste"));

                // Deselect target contents
                targetContents.selected = false;
                newShapeLayer.selected = false;
            }

            // Remove the original layer
            layer.remove();
        }

        app.endUndoGroup();
    } else {
        alert("Please select a composition.");
    }
}

mergeSelectedShapeLayers();
