console.log("Checking if Mapbox GL JS is loaded:", typeof mapboxgl);

if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is NOT loaded! Check script order in index.html.");
} else {
    console.log("Mapbox GL JS is loaded correctly.");
}

// Set Your Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoienZsMTIxNSIsImEiOiJjbTE4OG1lNnQwOG5lMmpxMnRwNGZnb3drIn0.U_npUNUZEOSOXVi5-SWgHw';

// Initialize the Map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=99e82fc4-ae1b-4d11-8f3e-1aebf67508f9',
    center: [-71.0589, 42.3601], // Boston
    zoom: 12
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

let geojsonData; 

// Ensure `map.on('load')` is registered BEFORE fetching data
map.on('load', () => {
    console.log("Map has loaded.");
    loadMapData();
});

// Load GeoJSON Data
async function loadMapData() {
    try {
        const response = await fetch('boston_neighborhoods_timelapse_cleaned.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        geojsonData = await response.json();
        console.log("GeoJSON Loaded:", geojsonData);

        if (!geojsonData || !geojsonData.features) {
            throw new Error("GeoJSON is empty or missing 'features'.");
        }

        // Add GeoJSON source
        map.addSource('boston-data', { type: 'geojson', data: geojsonData });

        // Add corporate ownership layer
        map.addLayer({
            id: 'corporate-ownership',
            type: 'fill',
            source: 'boston-data',
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'corp_own_rate'],
                    0.1, '#001f3f',
                    0.15, '#003366',
                    0.2, '#004c99',
                    0.25, '#7a42f4',
                    0.3, '#9333ea',
                    0.35, '#c026d3',
                    0.4, '#ff00ff'
                ],
                'fill-opacity': 0.85,
                'fill-outline-color': "#000"
            }
        });

        map.addLayer({
            id: 'corporate-ownership-outline',
            type: 'line',
            source: 'boston-data',
            paint: {
                'line-color': "#000",
                'line-width': 2,
                'line-opacity': 1
            }
        });

        // Add tooltip interaction AFTER layer is added
        let popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10
        });

        map.on('mousemove', 'corporate-ownership', (e) => {
            if (!e.features.length) return;

            const props = e.features[0].properties;
            popup.remove();

            popup.setLngLat(e.lngLat)
                .setHTML(`
                    <div style="font-family: Arial, sans-serif;">
            <strong style="font-size: 16px;">${props.neighborhood}</strong><br>
            <span style="font-size: 14px; font-weight: bold;">${props.year}</span><br>
            Corporate Ownership Rate: ${Math.round(props.corp_own_rate * 100)}%<br>
        </div>
                `)
                .addTo(map);
        });

        map.on('mouseleave', 'corporate-ownership', () => {
            popup.remove();
        });

        // Initialize the map with the latest year's data
        updateYear(2024);

    } catch (error) {
        console.error('Error loading GeoJSON:', error);
    }
}

// Function to Update Map Based on Selected Year
function updateYear(year) {
    console.log(`updateYear() called for year: ${year}`);

    document.getElementById('year-label').textContent = `Year: ${year}`; // Update UI label

    if (!geojsonData || !geojsonData.features) {
        console.error("GeoJSON data is not available.");
        return;
    }

    console.log("Filtering features for year:", year);

    const filteredFeatures = geojsonData.features.filter(feature => feature.properties.year === year);
    console.log(`Filtered ${filteredFeatures.length} features for year ${year}`);

    if (filteredFeatures.length === 0) {
        console.warn("No features found for this year.");
    }

    if (map.getSource('boston-data')) {
        console.log("Updating map data...");
        map.getSource('boston-data').setData({
            "type": "FeatureCollection",
            "features": filteredFeatures
        });
    } else {
        console.error("Map source 'boston-data' not found.");
    }
}

// Listen for Slider Changes
document.getElementById('year-slider').addEventListener('input', (e) => {
    updateYear(parseInt(e.target.value, 10));
});

document.addEventListener("DOMContentLoaded", function () {
    const yearSlider = document.getElementById('year-slider');
    const yearLabel = document.getElementById('year-label');

    if (!yearSlider || !yearLabel) {
        console.error("Slider or year label not found in DOM.");
        return;
    }

    yearSlider.addEventListener('input', (e) => {
        const selectedYear = parseInt(e.target.value, 10);
        console.log("Slider moved to year:", selectedYear);

        yearLabel.textContent = `Year: ${selectedYear}`;
        updateYear(selectedYear);
    });

    console.log("Slider event listener attached.");
});

// Load the GeoJSON Data
map.on('load', () => {
    console.log("Map has loaded.");
    loadMapData();
});
