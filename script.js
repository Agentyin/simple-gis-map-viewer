// Initialize the map
const map = L.map('map').setView([0, 37.9062], 6); // Centered at Kenya

// Add a base layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Add layer control for toggling between layers
const layerControl = L.control.layers().addTo(map);

// Handle file uploads
document.getElementById('file-input').addEventListener('change', function (event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        // Handle GeoJSON files
        if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
            reader.onload = function (e) {
                const geojsonData = JSON.parse(e.target.result);
                const geojsonLayer = L.geoJSON(geojsonData, {
                    onEachFeature: (feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            layer.bindPopup(`<b>${feature.properties.name}</b>`);
                        }
                    },
                }).addTo(map);
                layerControl.addOverlay(geojsonLayer, file.name);
            };
            reader.readAsText(file);
        }

        // Handle image files (e.g., PNG, JPG)
        else if (file.name.endsWith('.png') || file.name.endsWith('.jpg')) {
            reader.onload = function (e) {
                const imgBounds = [[-90, -180], [90, 180]]; // World bounds
                const imageLayer = L.imageOverlay(e.target.result, imgBounds).addTo(map);
                layerControl.addOverlay(imageLayer, file.name);
            };
            reader.readAsDataURL(file);
        }

        // Handle shapefile (ZIP format)
        else if (file.name.endsWith('.zip')) {
            reader.onload = async function (e) {
                const arrayBuffer = e.target.result;

                try {
                    const shapefileSource = await shapefile.open(arrayBuffer);
                    let shapefileLayer = L.layerGroup();

                    while (true) {
                        const result = await shapefileSource.read();
                        if (result.done) break;

                        // Convert shapefile geometry to GeoJSON and add to map
                        const geojsonFeature = {
                            type: "Feature",
                            geometry: result.value.geometry,
                            properties: result.value.properties,
                        };

                        L.geoJSON(geojsonFeature, {
                            onEachFeature: (feature, layer) => {
                                layer.bindPopup(JSON.stringify(feature.properties));
                            },
                        }).addTo(shapefileLayer);
                    }

                    shapefileLayer.addTo(map);
                    layerControl.addOverlay(shapefileLayer, file.name);
                } catch (error) {
                    alert("Error loading shapefile: " + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Unsupported file type. Please upload a GeoJSON, image, or shapefile.');
        }
    }
});