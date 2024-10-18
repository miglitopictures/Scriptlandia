(function(thisObj) {
    function implode() {
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

            var newShapeLayerPosition = selectedLayers[0].transform.position.value;
            var newShapeLayerAnchor = selectedLayers[0].transform.anchorPoint.value;


            // Create a new shape layer to merge into
            var newShapeLayer = comp.layers.addShape();
            newShapeLayer.name = "Imploded Shape Layer";
            newShapeLayer.transform.position.setValue(newShapeLayerPosition);
            newShapeLayer.transform.anchorPoint.setValue(newShapeLayerAnchor);

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
    };
    function explode() {
        var comp = app.project.activeItem;

        if (comp && comp instanceof CompItem) {
            var baseName = prompt("Enter base name for new layers:", "Shape Layer");

            if (!baseName) {
                alert("No base name provided. Operation cancelled.");
                return;
            }

            app.beginUndoGroup("Separate Shape Groups");

            var selectedLayers = comp.selectedLayers;

            if (selectedLayers.length === 0) {
                alert("Please select a shape layer.");
                return;
            }

            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];

                if (!(layer instanceof ShapeLayer)) {
                    alert("Please select a shape layer.");
                    return;
                }

                var shapeContents = layer.property("ADBE Root Vectors Group");

                if (shapeContents.numProperties > 0) {
                    var groupCount = 1; // Start numbering from 1
                    for (var j = shapeContents.numProperties; j >= 1; j--) {
                        var shapeGroup = shapeContents.property(j);

                        // Duplicate the layer
                        var newLayer = layer.duplicate();
                        newLayer.name = baseName + " " + groupCount; // Assign name with base name + number

                        // Remove all groups except the current one in the duplicated layer
                        var newShapeContents = newLayer.property("ADBE Root Vectors Group");

                        for (var k = newShapeContents.numProperties; k >= 1; k--) {
                            if (k !== j) {
                                newShapeContents.property(k).remove();
                            }
                        }

                        // Remove the group from the original layer
                        shapeGroup.remove();

                        groupCount++; // Increment the counter for the next layer
                    }
                }
            }

            app.endUndoGroup();
        } else {
            alert("Please select a composition.");
        }
    };
    function buildUI(thisObj) {
        var mainWindow = thisObj instanceof Panel
            ? thisObj
            : new Window("palette", "ShapeFreak", undefined, { resizeable: true, closeButton: true });
    
        mainWindow.orientation = "column";
    
        // Add a buttons
        var explodeBtn = mainWindow.add("button", undefined, "Explode");
        var implodeBtn = mainWindow.add("button", undefined, "Implode");
        
    
        // Event listener for the explode button
        explodeBtn.onClick = function () {
            explode();
        };
        // Event listener for the implode button
        implodeBtn.onClick = function () {
            implode();
        };
    
        return mainWindow;
    }

    // Build and display the UI
    var mainWindow = buildUI(thisObj);

    if (mainWindow instanceof Window) {
        mainWindow.center();
        mainWindow.show();
    } else {
        mainWindow.layout.layout(true);
    }
})(this);
