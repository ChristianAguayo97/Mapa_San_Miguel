function descargarComoGeoJSON(features) {
    const format = new ol.format.GeoJSON();
    const geojsonStr = format.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });
    const blob = new Blob([geojsonStr], { type: "application/vnd.geo+json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "datos.geojson";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function descargarComoExcel(features) {
    if (!features.length) return;

    // Unir todas las propiedades de todas las features
    const allProps = new Set();
    features.forEach(f => {
        Object.keys(f.getProperties()).forEach(k => {
            if (k !== "geometry") allProps.add(k);
        });
    });
    const props = Array.from(allProps);

    const data = features.map(f => {
        const obj = {};
        props.forEach(k => obj[k] = f.get(k) ?? "");
        obj["geometry"] = JSON.stringify(f.getGeometry().getCoordinates());
        return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, "datos.xlsx");
}


document.getElementById("descargarGeoJSON").addEventListener("click", function() {
    if (window.features && window.features.length > 0) {
        descargarComoGeoJSON(window.features);
    } else {
        alert("No hay datos para exportar.");
    }
});

document.getElementById("descargarExcel").addEventListener("click", function() {
    if (window.features && window.features.length > 0) {
        descargarComoExcel(window.features);
    } else {
        alert("No hay datos para exportar.");
    }
});