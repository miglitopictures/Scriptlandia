(function(thisObj) {
    // Function to apply the selected expression to the selected properties
    function applyExpression(selectedExpression) {
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
    
        // Loop through each selected property
        for (var i = 0; i < selectedProperties.length; i++) {
            var property = selectedProperties[i];
    
            // Get the layer that the property belongs to
            var layer = property.propertyGroup(property.propertyDepth);
    
            // Check if the property can accept expressions
            if (property.canSetExpression) {
                // Set the expression
                property.expression = selectedExpression;
            } //continue to next property
        }
    };


    function buildUI(thisObj) {
        var mainWindow = thisObj instanceof Panel
            ? thisObj
            : new Window("palette", "Move Buddy!", undefined, { resizeable: true, closeButton: true });
    
        mainWindow.orientation = "column";
        
        //Expression Dictionarie
        var expressions = {
        'Maintain Stroke Width': 'value / length(toComp([0,0]), toComp([0.7071,0.7071])) || 0.001;',
        'Ping Pong': 'loopOut("pingpong");',
        'Wave': 'var amplitude = 10;' + '\n'+ 'var frequency = 10;' + '\n' + 'value+Math.sin(time*frequency)*amplitude;',
        'Wiggle': 'var frequency = 10;  //Sacudidas por segundo' + '\n'+ 'var amplitude = 10;  //Força da sacudida' + '\n' + 'wiggle(frequency,amplitude);',
        'Follow Through': 'n = 0;' + '\n' + 'if (numKeys > 0) {' + '\n' + 'n = nearestKey(time).index;' + '\n' + 'if (key(n).time > time) {' + '\n' + "n--;" + '\n' + "}" + '\n' + "}" + '\n' + "if (n == 0) {" + '\n' + "t = 0;" + '\n' + "} else {" + '\n' + "t = time - key(n).time;" + '\n' + "}" + '\n' + "if (n > 0 && t < 1) {" + '\n' + "v = velocityAtTime(key(n).time - thisComp.frameDuration/10);" + '\n' + "amp = 30;" + '\n' + "freq = 2.0;" + '\n' + "decay = 6.0;" + '\n' + 'value + (v/100)*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);' + '\n' + '} else {' + '\n' + 'value;' + '\n' + '}',
        'Fade In' : 'var fadeTime = 1;' +'\n'+  'linear(time, inPoint, inPoint + fadeTime, 0, value);',
        'Fade Out' : 'var fadeTime = 1;' +'\n'+  'linear(time, outPoint - fadeTime, outPoint, value, 0);',
        'Fade In/Out' : 'var fadeTime = 1;' +'\n'+  'linear(time, inPoint, inPoint + fadeTime, 0, value);' + '\n' + 'linear(time, outPoint - fadeTime, outPoint, value, 0);',
        'Ignore Parent Rotation' : 'value - parent.transform.rotation;',
        'Ignore Parent Scale' : 's = [];' + '\n' + 'var parentScale = parent.transform.scale;' +'\n'+ 'for (i = 0; i < parentScale.length; i++){' +'\n'+ 's[i] = (parentScale[i]== 0) ? 0 : value[i]*100/parentScale[i];'+'\n'+ '}' +'\n'+ 's;',
        'Inherit Parent Opacity' : '(hasParent) ? parent.opacity : value;',
        }
        //Add dropdown menu
        var expressionDropdown = mainWindow.add("dropdownlist", undefined, undefined);
        // add items to dropdown from expression dictionarie
        for (var key in expressions) {
            expressionDropdown.add("item", key);
        }
        //select first item
        expressionDropdown.selection = 0;
        //add tooltip depending on the selected expression
        var tooltip = {
            'Maintain Stroke Width': "Apply it to stroke width.",
            'Ping Pong': 'Boomerang Loop.',
            'Wave': 'Basic Sine Wave.',
            'Wiggle': 'Unpredictable movement.',
            'Follow Through': 'Automatic follow through to your animations.',
            'Fade In' : 'Fade at the beginning of the layer.',
            'Fade Out' : 'Fade at the end of the layer.',
            'Fade In/Out' : 'You alredy know.',
            'Ignore Parent Rotation' : 'Good for Ferris Wheels.',
            'Ignore Parent Scale' : 'Self-explanatory.',
            'Inherit Parent Opacity' : 'Get the opacity from the parent layer.',    
        }
        expressionDropdown.helpTip = tooltip[expressionDropdown.selection.text];
        //Add event listener to dropdown
        expressionDropdown.onChange = function() {
            expressionDropdown.helpTip = tooltip[expressionDropdown.selection.text];
        }


    
        // Add a button to apply the expression
        var applyBtn = mainWindow.add("button", undefined, "Apply Expression");
        
    
        // Event listener for the explode button
        applyBtn.onClick = function () {
            // Get the selected expression from dictionarie
            var selectedExpression = expressions[expressionDropdown.selection.text];
            // Start undo group
            app.beginUndoGroup("Apply Expression");
            // Apply the expression
            applyExpression(selectedExpression);
            app.endUndoGroup();
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
