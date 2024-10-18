{
    function createFolderStructureAndOrganizeAssets() {
        var project = app.project;

        // Create folders in the project
        var rendersFolder = project.items.addFolder("00_RENDERS");
        var compsFolder = project.items.addFolder("01_COMPS");
        var precompsFolder = project.items.addFolder("02_PRECOMPS");
        var assetsFolder = project.items.addFolder("03_ASSETS");

        // Create subfolders inside the assets folder
        var audioFolder = project.items.addFolder("AUDIO");
        audioFolder.parentFolder = assetsFolder;

        var clipsFolder = project.items.addFolder("CLIPS");
        clipsFolder.parentFolder = assetsFolder;

        var picsFolder = project.items.addFolder("PICS");
        picsFolder.parentFolder = assetsFolder;

        var psdsFolder = project.items.addFolder("PSDS");
        psdsFolder.parentFolder = assetsFolder;

        var solidsFolder = project.items.addFolder("SOLIDS");
        solidsFolder.parentFolder = assetsFolder;

        var vectorFolder = project.items.addFolder("VECTOR");
        vectorFolder.parentFolder = assetsFolder;
    

        // Move items based on file type into the respective folder
        function moveToFolder(item) {
            if (item instanceof FootageItem) {
                if (item.mainSource instanceof FileSource) {
                    var file = item.mainSource.file;
                    var ext = file.name.split('.').pop().toLowerCase();

                    if (ext === "wav" || ext === "mp3" || ext === "aiff") {
                        item.parentFolder = audioFolder;
                    } else if (ext === "mp4" || ext === "mov" || ext === "avi" || ext === "mkv") {
                        item.parentFolder = clipsFolder;
                    } else if (ext === "jpg" || ext === "png" || ext === "jpeg" || ext === "tiff") {
                        item.parentFolder = picsFolder;
                    } else if (ext === "psd") {
                        item.parentFolder = psdsFolder;
                    } else if (ext === "ai" || ext === "eps" || ext === "svg") {
                        item.parentFolder = vectorFolder;
                    }
                }
                if (item.mainSource instanceof SolidSource) {
                    item.parentFolder = solidsFolder;
                }
            };
            if (item instanceof CompItem) {
                item.parentFolder = precompsFolder;
            };
        }

        // Organize assets into their respective folders
        function organizeAssets() {
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (!(item instanceof FolderItem)) {
                    moveToFolder(item);
                }
            }
        }

        // Move compositions and organize assets
        organizeAssets();

        // Message box to indicate success
        alert("Folder structure created, assets and compositions organized successfully!");
    }

    // Check if there's an active project and run the function
    if (app.project) {
        app.beginUndoGroup("Create Folder Structure and Organize Assets");
        createFolderStructureAndOrganizeAssets();
        app.endUndoGroup();
    } else {
        alert("No active project found.");
    }
}
