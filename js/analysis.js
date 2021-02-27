// Functions for performing the semantic view analysis
// By Juho-Pekka Virtanen, Aalto University, 2020
// Tested on Windows platform, with the Google Chrome browser.
// Please see the README.md for further information
// Please see the LICENCE.txt for licence information

//Colourspace conversions
function hexToRGB(h) {
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

        // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    return "rgb(" + +r + "," + +g + "," + +b + ")";
}

function RGBToHex(r,g,b) {

        r = r.toString(16),
        g = g.toString(16),
        b = b.toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

function assembleLabels() {
    var labels = [];
    var colors = [];
    var results = []; //this is to store results. It's initialized here to automatically ensure consistent lenght.

    for (var key in ALLCOLOURS) {
        var value = ALLCOLOURS[key];
        labels.push(key);
        colors.push(value);
        results.push(0);
        }

    return [labels, colors, results];
}

function runAnalysis(plot) {
    if (plot == true) {
    document.getElementById("analysisPlot").style.visibility = "visible";
    document.getElementById("analysisButton").innerHTML = "...now running...";
    }

    var checkLightState = false;

    //Priming some tables...
    var labels = assembleLabels()[0];
    var colors = assembleLabels()[1];
    var results = assembleLabels()[2];

    if (analysisLightingToggle == false) {
        toggleAnalysisLighting(); //Change to analysis lighting
        checkLightState = true;
    }

    //Refresh view
    renderer.render(scene, camera);

    //Retrieve viewer
    var viewer = document.getElementById("viewer");

    var screenshot = renderer.domElement.toDataURL("image/png");
    var canvas = document.createElement('canvas');
    canvas.height = viewer.offsetHeight;
    canvas.width = viewer.offsetWidth;

    var ctx = canvas.getContext("2d");

    //Configure image widths
    var img = document.createElement("IMG");
    img.width = canvas.width;
    img.height = canvas.height;

    img.src = screenshot;

    var totalPixels = 0;
    var skyPixels = 0;
    var buildingPixels = 0;
    var greenPixels = 0;
    var roadPixels = 0;
    var waterPixels = 0;

    img.onload = function () { //after the image is available, we continue...
        ctx.drawImage(img, 0, 0, img.width, img.height);

        var rowID = 0;
        var columnID = 0;

        while (rowID < img.height) {
            while (columnID < img.width) {
                var pixel = ctx.getImageData(columnID, rowID, 1, 1).data;
                columnID++;

                var colourIndex = 0;
                var hex = parseInt(RGBToHex(pixel[0], pixel[1], pixel[2]).replace("#", "0x"));

                while (colourIndex < labels.length) {
                    if (hex == colors[colourIndex]) {
                        results[colourIndex]++;
                    }
                    colourIndex++;
                }
                
                totalPixels++;
            }
            rowID++;
            columnID = 0;
        }

        //Obtain no sky pixels total count by iterating all other result classes
        var noSkyPixels = 0;
        colourIndex = 0;
        while (colourIndex < labels.length) {
            noSkyPixels = noSkyPixels + results[colourIndex];
            colourIndex++
        }

        //Compute sky pixels, add to results
        labels.push("Sky");
        colors.push(parseInt(RGBToHex(255, 255, 255).replace("#", "0x")));
        results.push(totalPixels - noSkyPixels);

        //Generate textual report after complete
        var report = "Semantic analysis of " + String(totalPixels) + " pixels complete!\n";
        var csvHeaders = "";
        var csvValues = "";

        colourIndex = 0;
        while (colourIndex < labels.length) {
            report = report + labels[colourIndex] + ": " + String(results[colourIndex]) + "\n";
            csvHeaders = csvHeaders + labels[colourIndex] + ", ";
            csvValues = csvValues + String(results[colourIndex]) + ", ";
            colourIndex++;
        }

        var cameraCoordinates = getCameraPosition(false);
        report = report + "\nCamera position:\nN: " + String(cameraCoordinates[1]) + "\nE: " + String(cameraCoordinates[0]) + "\nheight: " + String(cameraCoordinates[2]);

        csvHeaders = csvHeaders + "Total, "
        csvValues = csvValues +  String(totalPixels) + ", "

        csvHeaders = csvHeaders + "Cam N, Cam E, Cam height";
        csvValues = csvValues + String(cameraCoordinates[1]) + ", " + String(cameraCoordinates[0]) + ", " + String(cameraCoordinates[2]);

        if (plot == true) {
            //console.log(report);
            console.log(csvHeaders + "\n" + csvValues);
        }
        
        if(plot==true) {

        //Construct plot, first, prepare colors...
        var coloursRGB = [];

        colourIndex = 0
        while (colourIndex < colors.length) {
            coloursRGB.push(hexToRGB("#" + colors[colourIndex].toString(16)));
            colourIndex++;
        }

        var data = [{
            values: results,
            labels: labels,
            marker: {
                colors: coloursRGB
            },
            type: 'pie',
            sort: false
        }];

        var layout = {
            height: 600,
            width: 500
        };

        Plotly.newPlot('analysisPlot', data, layout);   
        }

        if (checkLightState == true) {
            toggleAnalysisLighting(); //Change to visualization lighting
        }

        //Refresh view
        renderer.render(scene, camera);

        if (plot == true) {
            document.getElementById("analysisButton").innerHTML = "Run semantic view analysis";
        }

        if (plot == false) {
            console.log(csvValues);
        }
    }
}

var spotHistory;
var ambientHistory;
var analysisLightingToggle = false;

function toggleAnalysisLighting() {

    // Retrieve lights
    var ambient = scene.getObjectByName("AmbientLight");
    var spot = scene.getObjectByName("SpotLight");


    if (analysisLightingToggle == false) {

        // Store old intensities 
        spotHistory = spot.intensity;
        ambientHistory = ambient.intensity;

        ambient.intensity = 1.0;
        spot.intensity = 0.0;

        analysisLightingToggle = true;

        document.getElementById("lightsButton").innerHTML = "Display visualization rendering";

    } else {
        // Restore intensities
        ambient.intensity = ambientHistory;
        spot.intensity = spotHistory;

        document.getElementById("lightsButton").innerHTML = "Display analysis rendering";
        analysisLightingToggle = false;
    }
}

function getCameraPosition(toggleLogging) {
    if (camera != null) {
        if (toggleLogging == true) { console.log("Camera found at position:"); }
    }

    if (bsOriginal != null && bsNormalized != null) {

        //Obtain camera position
        var posX = camera.position.x
        var posY = camera.position.y
        var posZ = camera.position.z

        var normFactor = bsOriginal[3]; //As normalized BS has radii of 1, we know that the scaling factor is simply the BS radii prior to normalization

        var shiftX = bsOriginal[0]; //As with above, we can simply use original BS position as shifts
        var shiftY = bsOriginal[1]; //As with above, we can simply use original BS position as shifts
        var shiftZ = bsOriginal[2]; //As with above, we can simply use original BS position as shifts

        if (toggleLogging == true) { console.log("Normalization factor: " + String(normFactor)); }

        //Compute unnormalized position, note the axis swaps and flips!
        var posXnorm = ((posX * normFactor) + shiftX) * -1;
        var posZnorm = (posY * normFactor) + shiftY;
        var posYnorm = (posZ * normFactor) + shiftZ;

    }
    if (toggleLogging == true) {
        console.log("Unnormalized camera position:");
        console.log("X: " + String(posXnorm));
        console.log("Y: " + String(posYnorm));
        console.log("Z: " + String(posZnorm));
    }

    var resultTable = [posXnorm, posYnorm, posZnorm];
    return resultTable
}