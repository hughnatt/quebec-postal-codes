const input = require('./inputs/geometry.json')
const codes = require('./inputs/codes.json')
const proj4 = require('proj4')
const fs = require('node:fs')
const geojsonRewind = require('@mapbox/geojson-rewind')

let postalCodes = codes.values[0].values.Code;

const projectToGps = (coordinates) => {
    return proj4('EPSG:3857', 'EPSG:4326', coordinates);
}

const geojson = {
    type: "FeatureCollection",
    features: [],
}


for (const f of input.f)
{
    let feature = {
        type: "Feature",
        properties: {
            code: postalCodes[f.p[0] - 1]
        },
        geometry: {
            type: "MultiPolygon",
            "coordinates": []
        }
    }

    for (const pointList of f.g.c)
    {
        const points = [];
        const basePoint = [pointList[0], pointList[1]]
        const projectedBasePoint = projectToGps(basePoint)
        points.push(projectedBasePoint)

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


geojsonRewind(geojson)
let content = JSON.stringify(geojson, null, 2);
fs.writeFileSync('./output.json', content);