// Script to separate each group within a Shape Layer into its own Shape Layer with a custom base name

function separateShapeGroupsWithBaseName() {
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
}

separateShapeGroupsWithBaseName();
