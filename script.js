let mapa;
let capaGeojson;


const estiloLinea = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'green',
        width: 4
    })
});
const estiloTransparente = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0,0,0,0.01)', 
        width: 8
    })
});
let estiloActual = estiloLinea;


document.addEventListener('DOMContentLoaded', function() {
    inicializarMapa();
    cargarGeoJsonDesdeArchivo('mapa.geojson');
    document.getElementById('toggleLineas').addEventListener('change', function(e) {
        if (capaGeojson) {
            estiloActual = e.target.checked ? estiloLinea : estiloTransparente;
            capaGeojson.setStyle(() => estiloActual);
        }
    });
    document.getElementById('botonCargarHoja').addEventListener('click', buscarDireccion);
});

function inicializarMapa() {
    mapa = new ol.Map({
        target: 'mapa',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-58.71145951544417, -34.54331449419978]),
            zoom: 17
        })
    });
}

async function cargarGeoJsonDesdeArchivo(nombreArchivo) {
    try {
        const respuesta = await fetch(nombreArchivo);
        if (!respuesta.ok) throw new Error('No se pudo cargar el archivo GeoJSON');
        const geojson = await respuesta.json();

        if (capaGeojson) mapa.removeLayer(capaGeojson);

        // Lee las features y guárdalas en window.features
        const features = new ol.format.GeoJSON().readFeatures(geojson, {
            featureProjection: 'EPSG:3857'
        });
        window.features = features; // <-- ESTA LÍNEA ES CLAVE

        capaGeojson = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: features
            }),
            style: estiloActual
        });

        mapa.addLayer(capaGeojson);

        const extension = capaGeojson.getSource().getExtent();
        if (!ol.extent.isEmpty(extension)) {
            mapa.getView().fit(extension, { padding: [40, 40, 40, 40], maxZoom: 19 });
        }

        // Evento de clic en línea
        mapa.on('singleclick', function(evento) {
            let encontrado = false;
            mapa.forEachFeatureAtPixel(evento.pixel, function(caracteristica) {
                const tipoGeometria = caracteristica.getGeometry().getType();
                if (tipoGeometria === 'LineString' || tipoGeometria === 'MultiLineString') {
                    mostrarCardPropiedades(caracteristica, evento);
                    encontrado = true;
                }
            });
            if (!encontrado) {
                const listaUbicaciones = document.getElementById('listaUbicaciones');
                if (listaUbicaciones) listaUbicaciones.innerHTML = '';
            }
        });
    } catch (err) {
        alert('Error al leer el archivo GeoJSON');
    }
}

function mostrarCardPropiedades(caracteristica, evento) {
    const propiedades = { ...caracteristica.getProperties() };
    delete propiedades.geometry;
    const listaUbicaciones = document.getElementById('listaUbicaciones');
    if (!listaUbicaciones) return;

    listaUbicaciones.innerHTML = `
        <div class="location-card">
            <div class="location-header">
                <b>${propiedades.etiqueta || 'Tramo'}</b>
            </div>
            <div class="location-description">
                ${Object.entries(propiedades).map(
                    ([k, v]) => `<div><b>${k}:</b> ${v}</div>`
                ).join('')}
            </div>
            <hr>
            <div>
                <input id="nueva-prop-clave" placeholder="Nombre propiedad" style="width: 45%;" />
                <input id="nueva-prop-valor" placeholder="Valor" style="width: 45%;" />
                <button id="agregar-propiedad">Agregar propiedad</button>
            </div>
        </div>
    `;

    document.getElementById('agregar-propiedad').onclick = function() {
        const clave = document.getElementById('nueva-prop-clave').value.trim();
        const valor = document.getElementById('nueva-prop-valor').value.trim();
        if (!clave) {
            alert('Ingrese un nombre de propiedad');
            return;
        }
        caracteristica.set(clave, valor);
        mostrarCardPropiedades(caracteristica, evento); // Recarga la card
    };
}

function buscarDireccion() {
    const direccion = document.getElementById('direccion').value;
    if (!direccion) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`)
        .then(response => response.json())
        .then(data => { 
            if (data && data.length > 0) {
                const lon = parseFloat(data[0].lon);
                const lat = parseFloat(data[0].lat);

                mapa.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
                mapa.getView().setZoom(17);

                const marcador = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
                });
                marcador.setStyle(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        scale: 0.05
                    })
                }));

                const vectorSource = new ol.source.Vector({
                    features: [marcador]
                });
                const markerLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                mapa.addLayer(markerLayer);

                setTimeout(() => {
                    mapa.removeLayer(markerLayer);
                }, 3000);

            } else {
                alert('Dirección no encontrada');
            }
        })
        .catch(() => alert('Error al buscar la dirección'));
}

