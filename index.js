const input = require('./inputs/geometry.json')
const codes = require('./inputs/codes.json')
const proj4 = require('proj4')
const fs = require('node:fs')
const geojsonRewind = require('@mapbox/geojson-rewind')


// Fonction de conversion de système de coordonnées
const projectToGps = (coordinates) => {
    return proj4('EPSG:3857', 'EPSG:4326', coordinates);
}

let postalCodes = codes.values[0].values.Code;

// Objet de sortie au format geojson
const geojson = {
    type: "FeatureCollection",
    features: [],
}

// Lecture des géométries
for (const f of input.f)
{
    let feature = {
        type: "Feature",
        properties: {
            // Association des codes postaux
            code: postalCodes[f.p[0] - 1]
        },
        geometry: {
            type: "MultiPolygon",
            "coordinates": []
        }
    }

    for (const pointList of f.g.c)
    {
        // Les deux premières valeur forment un point absolue
        const points = [];
        const basePoint = [pointList[0], pointList[1]]
        const projectedBasePoint = projectToGps(basePoint)
        points.push(projectedBasePoint)

        // Les valeurs suivantes sont des déplacements par rapport au point précédant.
        let i = 2;
        let lastPoint = basePoint;
        while (i < pointList.length)
        {
            const point = [lastPoint[0] + pointList[i], lastPoint[1] + pointList[i+1]]
            const projectedPoint = projectToGps(point)
            points.push(projectedPoint)
            i += 2
            lastPoint = point
        }

        points.push(projectedBasePoint)
        feature.geometry.coordinates.push([points]);
    }

    
    geojson.features.push(feature)
}

// Organisation de l'ordre des points des polygones (norme geojson).
geojsonRewind(geojson)

// Ecriture au format json dans le fichier de sortie.
let content = JSON.stringify(geojson, null, 2);
fs.writeFileSync('./output.json', content);