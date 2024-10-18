//WaveMaker3
function run() {
    // Ensure an active composition is open
    var comp = app.project.activeItem;
    if (comp == null || !(comp instanceof CompItem)) {
        alert("Please select properties in a composition.");
        return;
    }

    // Get the selected properties in the composition BEFORE creating the control layer
    var selectedProperties = comp.selectedProperties;

    // Ensure there are selected properties
    if (selectedProperties.length == 0) {
        alert("No properties selected.");
        return;
    }

    // Start undo group
    app.beginUndoGroup("Construct Wave");

    // Function to find the next available control name
    function getNextControlName(baseName) {
        var nameExists = true;
        var count = 0;
        var newName = baseName;

        while (nameExists) {
            nameExists = false;
            newName = count === 0 ? baseName : baseName + "_" + count;

            // Check if any layers already have this name
            for (var i = 1; i <= comp.numLayers; i++) {
                if (comp.layer(i).name === newName) {
                    nameExists = true;
                    count++;
                    break;
                }
            }
        }
        return newName;
    }

    // Add an adjustment layer called CONTROL with a unique name
    var controlLayerName = getNextControlName("CONTROL");
    var ctrl = comp.layers.addSolid([0, 0, 0], controlLayerName, comp.width, comp.height, 1);
    ctrl.adjustmentLayer = true;

    // Add sliders to the ctrl layer
    var amplitudeSlider = ctrl.Effects.addProperty("ADBE Slider Control");
    amplitudeSlider.name = "Amplitude";
    amplitudeSlider.property("Slider").setValue(50);

    var frequencySlider = ctrl.Effects.addProperty("ADBE Slider Control");
    frequencySlider.name = "Frequency";
    frequencySlider.property("Slider").setValue(10);

    var offsetSlider = ctrl.Effects.addProperty("ADBE Slider Control");
    offsetSlider.name = "Offset";
    offsetSlider.property("Slider").setValue(0);

    var timeDelaySlider = ctrl.Effects.addProperty("ADBE Slider Control");
    timeDelaySlider.name = "Time Delay";
    timeDelaySlider.property("Slider").setValue(0);

    var resultingExpression;

    // Expression to be applied, dynamically referencing the correct control layer name if the propriety is one-dimensional
    var expression1D =
        'var source = thisComp.layer("' + controlLayerName + '");\n' +
        'var amplitude = source.effect("Amplitude")("Slider");\n' +
        'var frequency = source.effect("Frequency")("Slider");\n' +
        'var offset = source.effect("Offset")("Slider");\n' +
        'var timeDelay = source.effect("Time Delay")("Slider");\n' +
        '\n' +
        'value + (amplitude * Math.sin(frequency * time + timeDelay * index)) + offset;';

    //Expression to be applied, dynamically referencing the correct control layer name if the propriety is two-dimensional
    var expression2D =
        'var source = thisComp.layer("' + controlLayerName + '");\n' +
        'var amplitude = source.effect("Amplitude")("Slider");\n' +
        'var frequency = source.effect("Frequency")("Slider");\n' +
        'var offset = source.effect("Offset")("Slider");\n' +
        'var timeDelay = source.effect("Time Delay")("Slider");\n' +
        '\n' +
        '[value[0] + (amplitude * Math.sin(frequency * time + timeDelay * index)) + offset, value[1] + (amplitude * Math.sin(frequency * time + timeDelay * index)) + offset];';

    // Create a set to keep track of layers that need to be parented
    var layersToParent = {};

    // Loop through each selected property
    for (var i = 0; i < selectedProperties.length; i++) {
        var property = selectedProperties[i];

        // Get the layer that the property belongs to
        var layer = property.propertyGroup(property.propertyDepth);

        // Skip the control layer
        if (layer == ctrl) {
            continue;
        }

        // Add the layer to the set of layers to parent
        layersToParent[layer.index] = layer;

        // Check the dimension of the property based on value length
        if (property.value instanceof Array && property.value.length > 1) {
        // If it's a 2D property (like Position on a shape layer)
        resultingExpression = expression2D;
        } else {
        // If it's a 1D property
        resultingExpression = expression1D;}

        // Check if the property can accept expressions
        if (property.canSetExpression) {
            // Set the expression
            property.expression = resultingExpression;
        } else {
            alert("Cannot set expression on property: " + property.name + " in layer: " + layer.name);
        }
    }

    // Parent the layers to the control layer
    for (var layerIndex in layersToParent) {
        var layerToParent = layersToParent[layerIndex];
        layerToParent.parent = ctrl;
    }

    app.endUndoGroup();
};
run();
