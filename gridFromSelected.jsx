{
    // Grid Arranger Script for Adobe After Effects with Sliders

    function gridArrange(thisObj) {
        // Check if a composition is active
        var comp = app.project.activeItem;
        if (comp == null || !(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        // Check if layers are selected
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length == 0) {
            alert("Please select at least one layer.");
            return;
        }

        // Create UI Panel
        var myPanel = thisObj instanceof Panel ? thisObj : new Window("palette", "Grid Arranger", undefined, { resizeable: true });
        myPanel.orientation = "column";
        myPanel.alignChildren = ["fill", "top"];

        // Number of Columns Slider
        var columnsGroup = myPanel.add("group");
        columnsGroup.add("statictext", undefined, "Number of Columns:");
        var columnsSlider = columnsGroup.add("slider", undefined, 3, 1, 20);
        columnsSlider.preferredSize.width = 200;
        var columnsValue = columnsGroup.add("statictext", undefined, "3");

        // Horizontal Spacing Slider
        var hSpacingGroup = myPanel.add("group");
        hSpacingGroup.add("statictext", undefined, "Horizontal Spacing (px):");
        var hSpacingSlider = hSpacingGroup.add("slider", undefined, 20, 0, 200);
        hSpacingSlider.preferredSize.width = 200;
        var hSpacingValue = hSpacingGroup.add("statictext", undefined, "20");

        // Vertical Spacing Slider
        var vSpacingGroup = myPanel.add("group");
        vSpacingGroup.add("statictext", undefined, "Vertical Spacing (px):");
        var vSpacingSlider = vSpacingGroup.add("slider", undefined, 20, 0, 200);
        vSpacingSlider.preferredSize.width = 200;
        var vSpacingValue = vSpacingGroup.add("statictext", undefined, "20");

        // Function to arrange layers
        function arrangeLayers() {
            var columns = Math.round(columnsSlider.value);
            var hSpacing = hSpacingSlider.value;
            var vSpacing = vSpacingSlider.value;

            columnsValue.text = columns.toString();
            hSpacingValue.text = Math.round(hSpacing).toString();
            vSpacingValue.text = Math.round(vSpacing).toString();

            if (isNaN(columns) || columns <= 0) {
                alert("Please enter a valid number of columns.");
                return;
            }

            app.beginUndoGroup("Grid Arrange");

            // Remove existing "Grid Controller" nulls to avoid duplicates
            for (var i = comp.layers.length; i >= 1; i--) {
                var layer = comp.layers[i];
                if (layer.name === "Grid Controller") {
                    layer.remove();
                }
            }

            // Create a null object to parent layers
            var nullLayer = comp.layers.addNull();
            nullLayer.name = "Grid Controller";
            nullLayer.moveToBeginning();

            // Arrays to store layer dimensions
            var layerWidths = [];
            var layerHeights = [];

            // Get layer dimensions
            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];

                // Get layer dimensions
                var bounds = layer.sourceRectAtTime(comp.time, false);
                var width = bounds.width * layer.scale.value[0] / 100;
                var height = bounds.height * layer.scale.value[1] / 100;

                layerWidths.push(width);
                layerHeights.push(height);
            }

            // Calculate total grid size
            var maxColWidth = [];
            var maxRowHeight = [];
            var totalWidth = 0;
            var totalHeight = 0;
            var numRows = Math.ceil(selectedLayers.length / columns);

            // Initialize arrays
            for (var c = 0; c < columns; c++) {
                maxColWidth[c] = 0;
            }
            for (var r = 0; r < numRows; r++) {
                maxRowHeight[r] = 0;
            }

            // Find max widths and heights
            for (var i = 0; i < selectedLayers.length; i++) {
                var col = i % columns;
                var row = Math.floor(i / columns);

                if (layerWidths[i] > maxColWidth[col]) {
                    maxColWidth[col] = layerWidths[i];
                }
                if (layerHeights[i] > maxRowHeight[row]) {
                    maxRowHeight[row] = layerHeights[i];
                }
            }

            // Calculate total grid width and height
            for (var c = 0; c < columns; c++) {
                totalWidth += maxColWidth[c];
            }
            totalWidth += hSpacing * (columns - 1);

            for (var r = 0; r < numRows; r++) {
                totalHeight += maxRowHeight[r];
            }
            totalHeight += vSpacing * (numRows - 1);

            // Starting positions to center the grid
            var startX = (comp.width / 2) - (totalWidth / 2);
            var startY = (comp.height / 2) - (totalHeight / 2);

            // Position layers
            var xPos = startX;
            var yPos = startY;

            for (var r = 0; r < numRows; r++) {
                xPos = startX;
                for (var c = 0; c < columns; c++) {
                    var idx = r * columns + c;
                    if (idx >= selectedLayers.length) {
                        break;
                    }
                    var layer = selectedLayers[idx];

                    // Calculate position
                    var x = xPos + maxColWidth[c] / 2;
                    var y = yPos + maxRowHeight[r] / 2;

                    layer.property("Position").setValue([x, y]);

                    // Parent to null
                    layer.parent = nullLayer;

                    // Update x position
                    xPos += maxColWidth[c] + hSpacing;
                }
                // Update y position
                yPos += maxRowHeight[r] + vSpacing;
            }

            // Position the null at the center of the grid
            nullLayer.property("Position").setValue([comp.width / 2, comp.height / 2]);

            app.endUndoGroup();
        }

        // Event handlers for sliders
        columnsSlider.onChanging = arrangeLayers;
        hSpacingSlider.onChanging = arrangeLayers;
        vSpacingSlider.onChanging = arrangeLayers;

        // Initial arrangement
        arrangeLayers();

        // Show the panel
        if (myPanel instanceof Window) {
            myPanel.center();
            myPanel.show();
        } else {
            myPanel.layout.layout(true);
            myPanel.layout.resize();
        }
    }

    // Run the script
    gridArrange(this);
}
