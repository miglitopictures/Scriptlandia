(function(thisObj) {
    // Define your functions and variables here

    function nullify() {
        var sizeSlider = mainWindow.sizeSlider;
        var selectedShape = mainWindow.squareRadio.value ? "square" : "circle";

        // Get the active composition
        var comp = app.project.activeItem;

        // Check if a composition is open
        if (comp == null || !(comp instanceof CompItem)) {
            alert("Please select or open a composition first.");
            return;
        }

        // Move the playhead to the first frame of the composition
        comp.time = comp.displayStartTime;

        // Get the selected layers
        var selectedLayers = comp.selectedLayers;

        // Check if layers are selected
        if (selectedLayers.length == 0) {
            alert("Please select at least one layer.");
            return;
        }

        app.beginUndoGroup("Parent Layers to Nulls");

        // Function to get the hierarchy depth of a layer
        function getLayerDepth(layer) {
            var depth = 0;
            var currentLayer = layer;
            while (currentLayer.parent != null) {
                depth++;
                currentLayer = currentLayer.parent;
            }
            return depth;
        }

        // Build an array of layers with their hierarchy depth
        var layersWithDepth = [];
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var depth = getLayerDepth(layer);
            layersWithDepth.push({ layer: layer, depth: depth });
        }

        // Sort the layers based on depth (deepest first)
        layersWithDepth.sort(function (a, b) {
            return b.depth - a.depth;
        });

        // Loop through each layer in the sorted array
        for (var i = 0; i < layersWithDepth.length; i++) {
            var layer = layersWithDepth[i].layer;
            var hasKeyframes = false;

            // Collect transform properties
            var transformProps = [
                layer.transform.position,
                layer.transform.scale,
            ];

            // Add rotation properties based on layer dimensionality
            if (layer.threeDLayer) {
                transformProps.push(layer.transform.orientation);
                transformProps.push(layer.transform.xRotation);
                transformProps.push(layer.transform.yRotation);
                transformProps.push(layer.transform.zRotation);
            } else {
                transformProps.push(layer.transform.rotation);
            }

            // Check if the layer has keyframes on any transform property
            for (var j = 0; j < transformProps.length; j++) {
                if (transformProps[j].numKeys > 0) {
                    hasKeyframes = true;
                    break;
                }
            }

            // Proceed if the layer has keyframes
            if (hasKeyframes) {
                // Create a null object
                var nullLayer = comp.layers.addShape();

                addVisibleNull(nullLayer, sizeSlider.value, selectedShape);

                nullLayer.name = layer.name + "_CTRL";
                nullLayer.threeDLayer = layer.threeDLayer; // Match 2D/3D status
                nullLayer.label = 1;

                // Check if the layer has a parent
                if (layer.parent != null) {
                    nullLayer.parent = layer.parent;
                }

                // Copy current transform values from the layer to the null
                nullLayer.transform.position.setValue(layer.transform.position.value);
                nullLayer.transform.scale.setValue(layer.transform.scale.value);

                if (layer.threeDLayer) {
                    nullLayer.transform.orientation.setValue(layer.transform.orientation.value);
                    nullLayer.transform.xRotation.setValue(layer.transform.xRotation.value);
                    nullLayer.transform.yRotation.setValue(layer.transform.yRotation.value);
                    nullLayer.transform.zRotation.setValue(layer.transform.zRotation.value);
                } else {
                    nullLayer.transform.rotation.setValue(layer.transform.rotation.value);
                }

                // Copy transform keyframes from the layer to the null
                for (var j = 0; j < transformProps.length; j++) {
                    var prop = transformProps[j];
                    if (prop.numKeys > 0) {
                        var nullProp = nullLayer.transform.property(prop.matchName);

                        // Remove existing keyframes from the null property (from last to first)
                        for (var k = nullProp.numKeys; k >= 1; k--) {
                            nullProp.removeKey(k);
                        }

                        // Copy keyframes from the layer to the null
                        for (var k = 1; k <= prop.numKeys; k++) {
                            var time = prop.keyTime(k);
                            var value = prop.keyValue(k);
                            var easeIn = prop.keyInTemporalEase(k);
                            var easeOut = prop.keyOutTemporalEase(k);
                            var interpIn = prop.keyInInterpolationType(k);
                            var interpOut = prop.keyOutInterpolationType(k);

                            var newKeyIndex = nullProp.addKey(time);
                            nullProp.setValueAtKey(newKeyIndex, value);
                            nullProp.setTemporalEaseAtKey(newKeyIndex, easeIn, easeOut);
                            nullProp.setInterpolationTypeAtKey(newKeyIndex, interpIn, interpOut);

                            // Copy spatial tangents and continuity for position properties
                            if (
                                prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||
                                prop.propertyValueType === PropertyValueType.TwoD_SPATIAL
                            ) {
                                nullProp.setSpatialTangentsAtKey(
                                    newKeyIndex,
                                    prop.keyInSpatialTangent(k),
                                    prop.keyOutSpatialTangent(k)
                                );
                                nullProp.setSpatialContinuousAtKey(newKeyIndex, prop.keySpatialContinuous(k));
                                nullProp.setRovingAtKey(newKeyIndex, prop.keyRoving(k));
                            }
                        }

                        // Remove keyframes from the original layer (from last to first)
                        for (var k = prop.numKeys; k >= 1; k--) {
                            prop.removeKey(k);
                        }
                    }
                }

                // Parent the original layer to the null
                layer.parent = nullLayer;
            }
        }

        app.endUndoGroup();
    }

    function addVisibleNull(nullLayer, nullSize, nullShape) {
        if (nullShape === "square") {
            var contents = nullLayer.property("ADBE Root Vectors Group");

            // Add a rectangle shape group
            var Group = contents.addProperty("ADBE Vector Group");
            Group.name = "Rectangle 1";

            // Add a rectangle path to the group
            var nullPath = Group.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");

            // Set the size of the rectangle
            nullPath.property("ADBE Vector Rect Size").setValue([nullSize, nullSize]);

            // Remove the fill if it exists
            var fillProperty = Group.property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill");
            if (fillProperty != null) {
                Group.property("ADBE Vectors Group").remove(fillProperty);
            }

            // Add a stroke to the rectangle group
            var stroke = Group.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");

            // Set the stroke color to red (RGB: [1, 0, 0])
            stroke.property("ADBE Vector Stroke Color").setValue([1, 0, 0]);

            // Set the stroke width to 2
            stroke.property("ADBE Vector Stroke Width").setValue(2);

            addGuide(contents, nullSize);
        } else if (nullShape === "circle") {
            var contents = nullLayer.property("ADBE Root Vectors Group");

            // Add an ellipse shape group
            var Group = contents.addProperty("ADBE Vector Group");
            Group.name = "Ellipse 1";

            // Add an ellipse path to the group
            var nullPath = Group.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");

            // Set the size of the ellipse
            nullPath.property("ADBE Vector Ellipse Size").setValue([nullSize, nullSize]);

            // Remove the fill if it exists
            var fillProperty = Group.property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill");
            if (fillProperty != null) {
                Group.property("ADBE Vectors Group").remove(fillProperty);
            }

            // Add a stroke to the ellipse group
            var stroke = Group.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");

            // Set the stroke color to red (RGB: [1, 0, 0])
            stroke.property("ADBE Vector Stroke Color").setValue([1, 0, 0]);

            // Set the stroke width to 2
            stroke.property("ADBE Vector Stroke Width").setValue(2);

            addGuide(contents, nullSize);
        }
    }

    function addGuide(contents, nullSize) {
        // Add a shape group for guides
        var guideGroup = contents.addProperty("ADBE Vector Group");
        guideGroup.name = "Guides";

        // Positions for the guide rectangles
        var positions = [
            [0, 0],
            [nullSize / 2, 0],
            [-nullSize / 2, 0],
            [0, nullSize / 2],
            [0, -nullSize / 2],
        ];

        // Add rectangle shapes at specified positions
        for (var i = 0; i < positions.length; i++) {
            var guidePath = guideGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
            guidePath.property("ADBE Vector Rect Size").setValue([5, 5]);
            guidePath.property("ADBE Vector Rect Position").setValue(positions[i]);
        }

        // Remove any existing stroke or fill (optional)
        var strokeProperty = guideGroup.property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke");
        if (strokeProperty != null) {
            guideGroup.property("ADBE Vectors Group").remove(strokeProperty);
        }
        var fillProperty = guideGroup.property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill");
        if (fillProperty != null) {
            guideGroup.property("ADBE Vectors Group").remove(fillProperty);
        }

        // Add a fill to the guide group
        var fill = guideGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue([1, 0, 0]); // Red color
    }

    function buildUI(thisObj) {
        var mainWindow = thisObj instanceof Panel
            ? thisObj
            : new Window("palette", "Nullify!", undefined, { resizeable: true, closeButton: true });
    
        mainWindow.orientation = "column";
    
        // Create a group for radio buttons
        var shapeGroup = mainWindow.add("group");
        shapeGroup.orientation = "row";
    
        // Add radio buttons
        var squareRadio = shapeGroup.add("radiobutton", undefined, "Square");
        var circleRadio = shapeGroup.add("radiobutton", undefined, "Circle");
    
        // Set default selection
        squareRadio.value = true; // Select 'Square' by default
    
        // Add a slider to control size
        var sizeSlider = mainWindow.add("slider", undefined, 50, 10, 100);
        sizeSlider.size = [200, 30];
    
        // Add static text label for the slider
        var sizeLabel = mainWindow.add("statictext", undefined, "Size: 50");
    
        // Add a button to apply changes
        var applyBtn = mainWindow.add("button", undefined, "Run");
    
        // Event listener to update the label when the slider moves
        sizeSlider.onChanging = function () {
            sizeLabel.text = "Size: " + Math.round(sizeSlider.value);
        };
    
        // Event listener for the Apply button
        applyBtn.onClick = function () {
            nullify();
        };
    
        // Expose sizeSlider and radio buttons to the nullify function
        mainWindow.sizeSlider = sizeSlider;
        mainWindow.squareRadio = squareRadio;
        mainWindow.circleRadio = circleRadio;
    
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
