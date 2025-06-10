import json
import os

def dividir_geojson(archivo_entrada, features_por_archivo=100):
    with open(archivo_entrada, 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    features = geojson['features']
    total = len(features)
    base = os.path.splitext(archivo_entrada)[0]

    for i in range(0, total, features_por_archivo):
        parte = {
            "type": "FeatureCollection",
            "features": features[i:i+features_por_archivo]
        }
        nombre_salida = f"{base}_parte_{i//features_por_archivo + 1}.geojson"
        with open(nombre_salida, 'w', encoding='utf-8') as f_out:
            json.dump(parte, f_out, ensure_ascii=False, indent=2)
        print(f"Guardado: {nombre_salida}")

# Ejecutar automáticamente al correr el script
if __name__ == "__main__":
    dividir_geojson('mapa2.geojson', features_por_archivo=100)