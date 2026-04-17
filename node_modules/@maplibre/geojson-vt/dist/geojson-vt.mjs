import KDBush from 'kdbush';

/**
 * calculate simplification data using optimized Douglas-Peucker algorithm
 * @param coords - flat array of coordinates
 * @param first - index of the first coordinate in the segment
 * @param last - index of the last coordinate in the segment
 * @param sqTolerance - square tolerance value
 */
function simplify(coords, first, last, sqTolerance) {
    let maxSqDist = sqTolerance;
    const mid = first + ((last - first) >> 1);
    let minPosToMid = last - first;
    let index;
    const ax = coords[first];
    const ay = coords[first + 1];
    const bx = coords[last];
    const by = coords[last + 1];
    for (let i = first + 3; i < last; i += 3) {
        const d = getSqSegDist(coords[i], coords[i + 1], ax, ay, bx, by);
        if (d > maxSqDist) {
            index = i;
            maxSqDist = d;
            continue;
        }
        if (d === maxSqDist) {
            // a workaround to ensure we choose a pivot close to the middle of the list,
            // reducing recursion depth, for certain degenerate inputs
            // https://github.com/mapbox/geojson-vt/issues/104
            const posToMid = Math.abs(i - mid);
            if (posToMid < minPosToMid) {
                index = i;
                minPosToMid = posToMid;
            }
        }
    }
    if (maxSqDist > sqTolerance) {
        if (index - first > 3)
            simplify(coords, first, index, sqTolerance);
        coords[index + 2] = maxSqDist;
        if (last - index > 3)
            simplify(coords, index, last, sqTolerance);
    }
}
/**
 * Claculates the square distance from a point to a segment
 * @param px - x coordinate of the point
 * @param py - y coordinate of the point
 * @param x - x coordinate of the first segment endpoint
 * @param y - y coordinate of the first segment endpoint
 * @param bx - x coordinate of the second segment endpoint
 * @param by - y coordinate of the second segment endpoint
 * @returns square distance from a point to a segment
 */
function getSqSegDist(px, py, x, y, bx, by) {
    let dx = bx - x;
    let dy = by - y;
    if (dx !== 0 || dy !== 0) {
        const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = bx;
            y = by;
        }
        else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }
    dx = px - x;
    dy = py - y;
    return dx * dx + dy * dy;
}

/**
 *
 * @param id - the feature's ID
 * @param type - the feature's type
 * @param geom - the feature's geometry
 * @param tags - the feature's properties
 * @returns the created feature
 */
function createFeature(id, type, geom, tags) {
    // This is mostly for TypeScript type narrowing
    const data = { type, geom };
    const feature = {
        id: id == null ? null : id,
        type: data.type,
        geometry: data.geom,
        tags,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
    switch (data.type) {
        case 'Point':
        case 'MultiPoint':
            calcLineBBox(feature, data.geom);
            break;
        case 'LineString':
            calcLineBBox(feature, data.geom.points);
            break;
        case 'Polygon':
            // the outer ring (ie [0]) contains all inner rings
            calcLineBBox(feature, data.geom[0].points);
            break;
        case 'MultiLineString':
            for (const line of data.geom) {
                calcLineBBox(feature, line.points);
            }
            break;
        case 'MultiPolygon':
            for (const polygon of data.geom) {
                // the outer ring (ie [0]) contains all inner rings
                calcLineBBox(feature, polygon[0].points);
            }
            break;
    }
    return feature;
}
function optimizeLineMemory(line) {
    const lineImmutable = line;
    if (line.points.length > 64) {
        lineImmutable.points = new Float64Array(line.points);
    }
}
function calcLineBBox(feature, geom) {
    for (let i = 0; i < geom.length; i += 3) {
        feature.minX = Math.min(feature.minX, geom[i]);
        feature.minY = Math.min(feature.minY, geom[i + 1]);
        feature.maxX = Math.max(feature.maxX, geom[i]);
        feature.maxY = Math.max(feature.maxY, geom[i + 1]);
    }
}

/**
 * converts GeoJSON to internal source features (an intermediate projected JSON vector format with simplification data)
 * @param data
 * @param options
 * @returns
 */
function convertToInternal(data, options) {
    const features = [];
    switch (data.type) {
        case 'FeatureCollection':
            for (let i = 0; i < data.features.length; i++) {
                featureToInternal(features, data.features[i], options, i);
            }
            break;
        case 'Feature':
            featureToInternal(features, data, options);
            break;
        default:
            featureToInternal(features, { geometry: data, properties: undefined }, options);
    }
    return features;
}
function featureToInternal(features, geojson, options, index) {
    if (!geojson.geometry)
        return;
    if (geojson.geometry.type === 'GeometryCollection') {
        convertGeometryCollection(features, geojson, geojson.geometry, options, index);
        return;
    }
    const coords = geojson.geometry.coordinates;
    if (!coords?.length)
        return;
    const id = getFeatureId(geojson, options, index);
    const tolerance = Math.pow(options.tolerance / ((1 << options.maxZoom) * options.extent), 2);
    switch (geojson.geometry.type) {
        case 'Point':
            convertPointFeature(features, id, geojson.geometry, geojson.properties);
            return;
        case 'MultiPoint':
            convertMultiPointFeature(features, id, geojson.geometry, geojson.properties);
            return;
        case 'LineString':
            convertLineStringFeature(features, id, geojson.geometry, tolerance, geojson.properties);
            return;
        case 'MultiLineString':
            convertMultiLineStringFeature(features, id, geojson.geometry, tolerance, options, geojson.properties);
            return;
        case 'Polygon':
            convertPolygonFeature(features, id, geojson.geometry, tolerance, geojson.properties);
            return;
        case 'MultiPolygon':
            convertMultiPolygonFeature(features, id, geojson.geometry, tolerance, geojson.properties);
            return;
        default:
            throw new Error('Input data is not a valid GeoJSON object.');
    }
}
function getFeatureId(geojson, options, index) {
    if (options.promoteId) {
        return geojson.properties?.[options.promoteId];
    }
    if (options.generateId) {
        return index || 0;
    }
    return geojson.id;
}
function convertGeometryCollection(features, geojson, geometry, options, index) {
    for (const geom of geometry.geometries) {
        featureToInternal(features, {
            id: geojson.id,
            geometry: geom,
            properties: geojson.properties
        }, options, index);
    }
}
function convertPointFeature(features, id, geom, properties) {
    const out = [];
    out.push(projectX(geom.coordinates[0]), projectY(geom.coordinates[1]), 0);
    features.push(createFeature(id, 'Point', out, properties));
}
function convertMultiPointFeature(features, id, geom, properties) {
    const out = [];
    for (const coords of geom.coordinates) {
        out.push(projectX(coords[0]), projectY(coords[1]), 0);
    }
    features.push(createFeature(id, 'MultiPoint', out, properties));
}
function convertLineStringFeature(features, id, geom, tolerance, properties) {
    const out = { points: [] };
    convertLine(geom.coordinates, out, tolerance, false);
    features.push(createFeature(id, 'LineString', out, properties));
}
function convertMultiLineStringFeature(features, id, geom, tolerance, options, properties) {
    if (options.lineMetrics) {
        // explode into linestrings to be able to track metrics
        for (const line of geom.coordinates) {
            const out = { points: [] };
            convertLine(line, out, tolerance, false);
            features.push(createFeature(id, 'LineString', out, properties));
        }
    }
    else {
        const out = [];
        convertLines(geom.coordinates, out, tolerance, false);
        features.push(createFeature(id, 'MultiLineString', out, properties));
    }
}
function convertPolygonFeature(features, id, geom, tolerance, properties) {
    const out = [];
    convertLines(geom.coordinates, out, tolerance, true);
    features.push(createFeature(id, 'Polygon', out, properties));
}
function convertMultiPolygonFeature(features, id, geom, tolerance, properties) {
    const out = [];
    for (const polygon of geom.coordinates) {
        const polygonOut = [];
        convertLines(polygon, polygonOut, tolerance, true);
        out.push(polygonOut);
    }
    features.push(createFeature(id, 'MultiPolygon', out, properties));
}
function convertLine(ring, out, tolerance, isPolygon) {
    let x0, y0;
    let size = 0;
    for (let j = 0; j < ring.length; j++) {
        const x = projectX(ring[j][0]);
        const y = projectY(ring[j][1]);
        out.points.push(x, y, 0);
        if (j > 0) {
            if (isPolygon) {
                size += (x0 * y - x * y0) / 2; // area
            }
            else {
                size += Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)); // length
            }
        }
        x0 = x;
        y0 = y;
    }
    const last = out.points.length - 3;
    out.points[2] = 1;
    if (tolerance > 0)
        simplify(out.points, 0, last, tolerance);
    out.points[last + 2] = 1;
    optimizeLineMemory(out);
    out.size = Math.abs(size);
    out.start = 0;
    out.end = out.size;
}
function convertLines(rings, out, tolerance, isPolygon) {
    for (let i = 0; i < rings.length; i++) {
        const geom = { points: [] };
        convertLine(rings[i], geom, tolerance, isPolygon);
        out.push(geom);
    }
}
/**
 * Convert longitude to spherical mercator in [0..1] range
 */
function projectX(x) {
    return x / 360 + 0.5;
}
/**
 * Convert latitude to spherical mercator in [0..1] range
 */
function projectY(y) {
    const sin = Math.sin(y * Math.PI / 180);
    const y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
    return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
}

/**
 * Converts internal source features back to GeoJSON format.
 */
function convertToGeoJSON(source) {
    const geojson = {
        type: 'FeatureCollection',
        features: source.map(feature => featureToGeoJSON(feature))
    };
    return geojson;
}
/**
 * Converts a single internal feature to GeoJSON format.
 */
function featureToGeoJSON(feature) {
    const geojsonFeature = {
        type: 'Feature',
        geometry: geometryToGeoJSON(feature),
        properties: feature.tags
    };
    if (feature.id != null) {
        geojsonFeature.id = feature.id;
    }
    return geojsonFeature;
}
/**
 * Converts a single internal feature geometry to GeoJSON format.
 */
function geometryToGeoJSON(feature) {
    const { type, geometry } = feature;
    switch (type) {
        case 'Point':
            return {
                type: type,
                coordinates: unprojectPoint(geometry[0], geometry[1])
            };
        case 'MultiPoint':
            return {
                type: type,
                coordinates: unprojectPoints(geometry)
            };
        case 'LineString':
            return {
                type: type,
                coordinates: unprojectPoints(geometry.points)
            };
        case 'MultiLineString':
        case 'Polygon':
            return {
                type: type,
                coordinates: geometry.map(ring => unprojectPoints(ring.points))
            };
        case 'MultiPolygon':
            return {
                type: type,
                coordinates: geometry.map(polygon => polygon.map(ring => unprojectPoints(ring.points)))
            };
    }
}
function unprojectPoints(coords) {
    const result = [];
    for (let i = 0; i < coords.length; i += 3) {
        result.push(unprojectPoint(coords[i], coords[i + 1]));
    }
    return result;
}
function unprojectPoint(x, y) {
    return [unprojectX(x), unprojectY(y)];
}
/**
 * Convert spherical mercator in [0..1] range to longitude
 */
function unprojectX(x) {
    return (x - 0.5) * 360;
}
/**
 * Convert spherical mercator in [0..1] range to latitude
 */
function unprojectY(y) {
    const y2 = (180 - y * 360) * Math.PI / 180;
    return 360 * Math.atan(Math.exp(y2)) / Math.PI - 90;
}

var AxisType;
(function (AxisType) {
    AxisType[AxisType["X"] = 0] = "X";
    AxisType[AxisType["Y"] = 1] = "Y";
})(AxisType || (AxisType = {}));
/**
 * clip features between two vertical or horizontal axis-parallel lines:
 *     |        |
 *  ___|___     |     /
 * /   |   \____|____/
 *     |        |
 *
 * @param features - the features to clip
 * @param scale - the scale to divide start and end inputs
 * @param start - the start of the clip range
 * @param end - the end of the clip range
 * @param axis - which axis to clip against
 * @param minAll - the minimum for all features in the relevant axis
 * @param maxAll - the maximum for all features in the relevant axis
 */
function clip(features, scale, start, end, axis, minAll, maxAll, options) {
    start /= scale;
    end /= scale;
    if (minAll >= start && maxAll < end) { // trivial accept
        return features;
    }
    if (maxAll < start || minAll >= end) { // trivial reject
        return null;
    }
    const clipped = [];
    for (const feature of features) {
        const min = axis === AxisType.X ? feature.minX : feature.minY;
        const max = axis === AxisType.X ? feature.maxX : feature.maxY;
        if (min >= start && max < end) { // trivial accept
            clipped.push(feature);
            continue;
        }
        if (max < start || min >= end) { // trivial reject
            continue;
        }
        switch (feature.type) {
            case 'Point':
            case 'MultiPoint': {
                clipPointFeature(feature, clipped, start, end, axis);
                continue;
            }
            case 'LineString': {
                clipLineStringFeature(feature, clipped, start, end, axis, options);
                continue;
            }
            case 'MultiLineString': {
                clipMultiLineStringFeature(feature, clipped, start, end, axis);
                continue;
            }
            case 'Polygon': {
                clipPolygonFeature(feature, clipped, start, end, axis);
                continue;
            }
            case 'MultiPolygon': {
                clipMultiPolygonFeature(feature, clipped, start, end, axis);
                continue;
            }
        }
    }
    if (!clipped.length)
        return null;
    return clipped;
}
function clipPointFeature(feature, clipped, start, end, axis) {
    const geom = [];
    clipPoints(feature.geometry, geom, start, end, axis);
    if (!geom.length)
        return;
    const type = geom.length === 3 ? 'Point' : 'MultiPoint';
    clipped.push(createFeature(feature.id, type, geom, feature.tags));
}
function clipLineStringFeature(feature, clipped, start, end, axis, options) {
    const geom = [];
    clipLine(feature.geometry, geom, start, end, axis, false, options.lineMetrics);
    if (!geom.length)
        return;
    if (options.lineMetrics) {
        for (const line of geom) {
            clipped.push(createFeature(feature.id, 'LineString', line, feature.tags));
        }
        return;
    }
    if (geom.length > 1) {
        clipped.push(createFeature(feature.id, 'MultiLineString', geom, feature.tags));
        return;
    }
    clipped.push(createFeature(feature.id, 'LineString', geom[0], feature.tags));
}
function clipMultiLineStringFeature(feature, clipped, start, end, axis) {
    const geom = [];
    clipLines(feature.geometry, geom, start, end, axis, false);
    if (!geom.length)
        return;
    if (geom.length === 1) {
        clipped.push(createFeature(feature.id, 'LineString', geom[0], feature.tags));
        return;
    }
    clipped.push(createFeature(feature.id, 'MultiLineString', geom, feature.tags));
}
function clipPolygonFeature(feature, clipped, start, end, axis) {
    const geom = [];
    clipLines(feature.geometry, geom, start, end, axis, true);
    if (!geom.length)
        return;
    clipped.push(createFeature(feature.id, 'Polygon', geom, feature.tags));
}
function clipMultiPolygonFeature(feature, clipped, start, end, axis) {
    const geom = [];
    for (const polygon of feature.geometry) {
        const newPolygon = [];
        clipLines(polygon, newPolygon, start, end, axis, true);
        if (!newPolygon.length)
            continue;
        geom.push(newPolygon);
    }
    if (!geom.length)
        return;
    clipped.push(createFeature(feature.id, 'MultiPolygon', geom, feature.tags));
}
function clipPoints(geom, newGeom, start, end, axis) {
    for (let i = 0; i < geom.length; i += 3) {
        const a = geom[i + axis];
        if (a >= start && a <= end) {
            addPoint(newGeom, geom[i], geom[i + 1], geom[i + 2]);
        }
    }
}
function clipLine(geom, newGeom, start, end, axis, isPolygon, trackMetrics) {
    let slice = newSlice(geom);
    const intersect = axis === AxisType.X ? intersectX : intersectY;
    let len = geom.start;
    let segLen, t;
    for (let i = 0; i < geom.points.length - 3; i += 3) {
        const ax = geom.points[i];
        const ay = geom.points[i + 1];
        const az = geom.points[i + 2];
        const bx = geom.points[i + 3];
        const by = geom.points[i + 4];
        const a = axis === AxisType.X ? ax : ay;
        const b = axis === AxisType.X ? bx : by;
        let exited = false;
        if (trackMetrics)
            segLen = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        if (a < start) {
            // ---|-->  | (line enters the clip region from the left)
            if (b > start) {
                t = intersect(slice, ax, ay, bx, by, start);
                if (trackMetrics)
                    slice.start = len + segLen * t;
            }
        }
        else if (a > end) {
            // |  <--|--- (line enters the clip region from the right)
            if (b < end) {
                t = intersect(slice, ax, ay, bx, by, end);
                if (trackMetrics)
                    slice.start = len + segLen * t;
            }
        }
        else {
            addPoint(slice.points, ax, ay, az);
        }
        if (b < start && a >= start) {
            // <--|---  | or <--|-----|--- (line exits the clip region on the left)
            t = intersect(slice, ax, ay, bx, by, start);
            exited = true;
        }
        if (b > end && a <= end) {
            // |  ---|--> or ---|-----|--> (line exits the clip region on the right)
            t = intersect(slice, ax, ay, bx, by, end);
            exited = true;
        }
        if (!isPolygon && exited) {
            if (trackMetrics)
                slice.end = len + segLen * t;
            newGeom.push(slice);
            slice = newSlice(geom);
        }
        if (trackMetrics)
            len += segLen;
    }
    // add the last point
    let last = geom.points.length - 3;
    const ax = geom.points[last];
    const ay = geom.points[last + 1];
    const az = geom.points[last + 2];
    const a = axis === AxisType.X ? ax : ay;
    if (a >= start && a <= end)
        addPoint(slice.points, ax, ay, az);
    // close the polygon if its endpoints are not the same after clipping
    last = slice.points.length - 3;
    if (isPolygon && last >= 3 && (slice.points[last] !== slice.points[0] || slice.points[last + 1] !== slice.points[1])) {
        addPoint(slice.points, slice.points[0], slice.points[1], slice.points[2]);
    }
    // add the final slice
    if (slice.points.length) {
        optimizeLineMemory(slice);
        newGeom.push(slice);
    }
}
function newSlice(line) {
    return {
        points: [],
        size: line.size,
        start: line.start,
        end: line.end
    };
}
function clipLines(geom, newGeom, start, end, axis, isPolygon) {
    for (const line of geom) {
        clipLine(line, newGeom, start, end, axis, isPolygon, false);
    }
}
function addPoint(out, x, y, z) {
    out.push(x, y, z);
}
function intersectX(out, ax, ay, bx, by, x) {
    const t = (x - ax) / (bx - ax);
    addPoint(out.points, x, ay + (by - ay) * t, 1);
    return t;
}
function intersectY(out, ax, ay, bx, by, y) {
    const t = (y - ay) / (by - ay);
    addPoint(out.points, ax + (bx - ax) * t, y, 1);
    return t;
}

function wrap(features, options) {
    const buffer = options.buffer / options.extent;
    let merged = features;
    const left = clip(features, 1, -1 - buffer, buffer, AxisType.X, -1, 2, options); // left world copy
    const right = clip(features, 1, 1 - buffer, 2 + buffer, AxisType.X, -1, 2, options); // right world copy
    if (!left && !right)
        return merged;
    merged = clip(features, 1, -buffer, 1 + buffer, AxisType.X, -1, 2, options) || []; // center world copy
    if (left)
        merged = shiftFeatureCoords(left, 1).concat(merged); // merge left into center
    if (right)
        merged = merged.concat(shiftFeatureCoords(right, -1)); // merge right into center
    return merged;
}
function shiftFeatureCoords(features, offset) {
    const newFeatures = [];
    for (const feature of features) {
        switch (feature.type) {
            case 'Point':
            case 'MultiPoint': {
                const newGeometry = shiftPointCoords(feature.geometry, offset);
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
            case 'LineString': {
                const newGeometry = shiftLineCoords(feature.geometry, offset);
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
            case 'MultiLineString':
            case 'Polygon': {
                const newGeometry = [];
                for (const line of feature.geometry) {
                    newGeometry.push(shiftLineCoords(line, offset));
                }
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
            case 'MultiPolygon': {
                const newGeometry = [];
                for (const polygon of feature.geometry) {
                    const newPolygon = [];
                    for (const line of polygon) {
                        newPolygon.push(shiftLineCoords(line, offset));
                    }
                    newGeometry.push(newPolygon);
                }
                newFeatures.push(createFeature(feature.id, feature.type, newGeometry, feature.tags));
                continue;
            }
        }
    }
    return newFeatures;
}
function shiftPointCoords(coords, offset) {
    const newCoords = [];
    for (let i = 0; i < coords.length; i += 3) {
        newCoords.push(coords[i] + offset, coords[i + 1], coords[i + 2]);
    }
    return newCoords;
}
function shiftLineCoords(line, offset) {
    const newLine = {
        points: [],
        size: line.size
    };
    if (line.start !== undefined) {
        newLine.start = line.start;
        newLine.end = line.end;
    }
    for (let i = 0; i < line.points.length; i += 3) {
        newLine.points.push(line.points[i] + offset, line.points[i + 1], line.points[i + 2]);
    }
    optimizeLineMemory(newLine);
    return newLine;
}

/**
 * Applies a GeoJSON Source Diff to an existing set of simplified features
 * @param source
 * @param dataDiff
 * @param options
 * @returns
 */
function applySourceDiff(source, dataDiff, options) {
    // convert diff to sets/maps for o(1) lookups
    const diff = diffToHashed(dataDiff, options);
    // collection for features that will be affected by this update and used to invalidate tiles
    let affected = [];
    if (diff.removeAll) {
        affected = source;
        source = [];
    }
    if (diff.remove.size || diff.add.size) {
        const removeFeatures = [];
        // Collect features to remove (explicit removals + replacements via add)
        for (const feature of source) {
            if (diff.remove.has(feature.id) || diff.add.has(feature.id)) {
                removeFeatures.push(feature);
            }
        }
        if (removeFeatures.length) {
            affected.push(...removeFeatures);
            const removeIds = new Set(removeFeatures.map(f => f.id));
            source = source.filter(f => !removeIds.has(f.id));
        }
        if (diff.add.size) {
            let addFeatures = convertToInternal({ type: 'FeatureCollection', features: Array.from(diff.add.values()) }, options);
            addFeatures = wrap(addFeatures, options);
            affected.push(...addFeatures);
            source.push(...addFeatures);
        }
    }
    if (diff.update.size) {
        // Features can be duplicated across the antimeridian (wrap) in a single tile, so must update all instances with the same id
        const oldFeaturesMap = new Map();
        const keepFeatures = [];
        for (const feature of source) {
            if (diff.update.has(feature.id)) {
                oldFeaturesMap.set(feature.id, [...(oldFeaturesMap.get(feature.id) || []), feature]);
            }
            else {
                keepFeatures.push(feature);
            }
        }
        for (const [id, update] of diff.update) {
            const oldFeatures = oldFeaturesMap.get(id);
            if (!oldFeatures || oldFeatures.length === 0)
                continue;
            const updatedFeatures = getUpdatedFeatures(oldFeatures, update, options);
            affected.push(...oldFeatures, ...updatedFeatures);
            keepFeatures.push(...updatedFeatures);
        }
        source = keepFeatures;
    }
    return { affected, source };
}
/**
 * Gets updated simplified feature(s) based on a diff update object.
 * @param vtFeatures - the original features
 * @param update - the update object to apply
 * @param options - the options to use for the wrap method
 * @returns Updated features. If geometry is updated, returns new feature(s) converted from geojson and wrapped. If only properties are updated, returns feature(s) with tags updated.
 */
function getUpdatedFeatures(vtFeatures, update, options) {
    const changeGeometry = !!update.newGeometry;
    const changeProps = update.removeAllProperties ||
        update.removeProperties?.length > 0 ||
        update.addOrUpdateProperties?.length > 0;
    // if geometry changed, need to create a new geojson feature and convert to internal format
    if (changeGeometry) {
        const vtFeature = vtFeatures[0];
        const geojsonFeature = {
            type: 'Feature',
            id: vtFeature.id,
            geometry: update.newGeometry,
            properties: changeProps ? applyPropertyUpdates(vtFeature.tags, update) : vtFeature.tags
        };
        let features = convertToInternal({ type: 'FeatureCollection', features: [geojsonFeature] }, options);
        features = wrap(features, options);
        return features;
    }
    if (changeProps) {
        const updated = [];
        for (const vtFeature of vtFeatures) {
            const feature = { ...vtFeature };
            feature.tags = applyPropertyUpdates(feature.tags, update);
            updated.push(feature);
        }
        return updated;
    }
    return vtFeatures;
}
/**
 * helper to apply property updates from a diff update object to a properties object
 */
function applyPropertyUpdates(tags, update) {
    if (update.removeAllProperties) {
        return {};
    }
    const properties = { ...tags || {} };
    if (update.removeProperties) {
        for (const key of update.removeProperties) {
            delete properties[key];
        }
    }
    if (update.addOrUpdateProperties) {
        for (const { key, value } of update.addOrUpdateProperties) {
            properties[key] = value;
        }
    }
    return properties;
}
/**
 * Convert a GeoJSON Source Diff to an idempotent hashed representation using Sets and Maps
 */
function diffToHashed(diff, options) {
    if (!diff)
        return {
            remove: new Set(),
            add: new Map(),
            update: new Map()
        };
    const hashed = {
        removeAll: diff.removeAll,
        remove: new Set(diff.remove || []),
        add: new Map(diff.add?.map(feature => [options.promoteId ? feature.properties[options.promoteId] : feature.id, feature])),
        update: new Map(diff.update?.map(update => [update.id, update]))
    };
    return hashed;
}

const defaultClusterOptions = {
    minZoom: 0,
    maxZoom: 16,
    minPoints: 2,
    radius: 40,
    extent: 512,
    nodeSize: 64,
    log: false,
    generateId: false,
    reduce: null,
    map: (props) => props
};
const OFFSET_ZOOM = 2;
const OFFSET_ID = 3;
const OFFSET_PARENT = 4;
const OFFSET_NUM = 5;
const OFFSET_PROP = 6;
/**
 * This class allow clustering of geojson points.
 */
class ClusterTileIndex {
    constructor(options) {
        this.options = Object.assign(Object.create(defaultClusterOptions), options);
        this.trees = new Array(this.options.maxZoom + 1);
        this.stride = this.options.reduce ? 7 : 6;
        this.clusterProps = [];
        this.points = [];
    }
    /**
     * Loads GeoJSON point features and builds the internal clustering index.
     * @param points - GeoJSON point features to cluster.
     */
    load(points) {
        const features = [];
        // Convert GeoJSON point features to GeoJSONVT internal point features
        for (const point of points) {
            if (!point.geometry) {
                continue;
            }
            const [lng, lat] = point.geometry.coordinates;
            const [x, y] = [projectX(lng), projectY(lat)];
            const feature = {
                id: point.id,
                type: 'Point',
                geometry: [x, y],
                tags: point.properties
            };
            features.push(feature);
        }
        this.createIndex(features);
    }
    /**
     * @internal
     * Loads internal GeoJSONVT point features from a data source and builds the clustering index.
     * @param features - {@link GeoJSONVTInternalFeature} data source features to filter and cluster.
     */
    initialize(features) {
        const points = [];
        for (const feature of features) {
            if (feature.type !== 'Point')
                continue;
            points.push(feature);
        }
        this.createIndex(points);
    }
    /**
     * @internal
     * Updates the cluster data by rebuilding.
     * @param features
     */
    updateIndex(features, _affected, options) {
        this.options = Object.assign(Object.create(defaultClusterOptions), options.clusterOptions);
        this.initialize(features);
    }
    createIndex(points) {
        const { log, minZoom, maxZoom } = this.options;
        if (log)
            console.time('total time');
        const timerId = `prepare ${points.length} points`;
        if (log)
            console.time(timerId);
        this.points = points;
        // generate a cluster object for each point and index input points into a KD-tree
        const data = [];
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (!p?.geometry)
                continue;
            let [x, y] = p.geometry;
            x = Math.fround(x);
            y = Math.fround(y);
            // store internal point/cluster data in flat numeric arrays for performance
            data.push(x, y, // projected point coordinates
            Infinity, // the last zoom the point was processed at
            i, // index of the source feature in the original input array
            -1, // parent cluster id
            1 // number of points in a cluster
            );
            if (this.options.reduce)
                data.push(0); // noop
        }
        let tree = this.trees[maxZoom + 1] = this.createTree(data);
        if (log)
            console.timeEnd(timerId);
        // cluster points on max zoom, then cluster the results on previous zoom, etc.;
        // results in a cluster hierarchy across zoom levels
        for (let z = maxZoom; z >= minZoom; z--) {
            const now = Date.now();
            // create a new set of clusters for the zoom and index them with a KD-tree
            tree = this.trees[z] = this.createTree(this.cluster(tree, z));
            if (log)
                console.log('z%d: %d clusters in %dms', z, tree.numItems, Date.now() - now);
        }
        if (log)
            console.timeEnd('total time');
    }
    /**
     * Returns clusters and/or points within a bounding box at a given zoom level.
     * @param bbox - Bounding box in `[westLng, southLat, eastLng, northLat]` order.
     * @param zoom - Zoom level to query.
     */
    getClusters(bbox, zoom) {
        const clusterInternal = this.getClustersInternal(bbox, zoom);
        return clusterInternal.map((f) => featureToGeoJSON(f));
    }
    getClustersInternal(bbox, zoom) {
        let minLng = ((bbox[0] + 180) % 360 + 360) % 360 - 180;
        const minLat = Math.max(-90, Math.min(90, bbox[1]));
        let maxLng = bbox[2] === 180 ? 180 : ((bbox[2] + 180) % 360 + 360) % 360 - 180;
        const maxLat = Math.max(-90, Math.min(90, bbox[3]));
        if (bbox[2] - bbox[0] >= 360) {
            minLng = -180;
            maxLng = 180;
        }
        else if (minLng > maxLng) {
            const easternHem = this.getClustersInternal([minLng, minLat, 180, maxLat], zoom);
            const westernHem = this.getClustersInternal([-180, minLat, maxLng, maxLat], zoom);
            return easternHem.concat(westernHem);
        }
        const tree = this.trees[this.limitZoom(zoom)];
        const ids = tree.range(projectX(minLng), projectY(maxLat), projectX(maxLng), projectY(minLat));
        const data = tree.flatData;
        const clusters = [];
        for (const id of ids) {
            const k = this.stride * id;
            clusters.push(data[k + OFFSET_NUM] > 1 ? getClusterFeature(data, k, this.clusterProps) : this.points[data[k + OFFSET_ID]]);
        }
        return clusters;
    }
    /**
     * Returns the immediate children (clusters or points) of a cluster as GeoJSON.
     * @param clusterId - The target cluster id.
     */
    getChildren(clusterId) {
        const originId = this.getOriginId(clusterId);
        const originZoom = this.getOriginZoom(clusterId);
        const clusterError = new Error('No cluster with the specified id: ' + clusterId);
        const tree = this.trees[originZoom];
        if (!tree)
            throw clusterError;
        const data = tree.flatData;
        if (originId * this.stride >= data.length)
            throw clusterError;
        const r = this.options.radius / (this.options.extent * Math.pow(2, originZoom - 1));
        const x = data[originId * this.stride];
        const y = data[originId * this.stride + 1];
        const ids = tree.within(x, y, r);
        const children = [];
        for (const id of ids) {
            const k = id * this.stride;
            if (data[k + OFFSET_PARENT] === clusterId) {
                children.push(data[k + OFFSET_NUM] > 1 ? getClusterGeoJSON(data, k, this.clusterProps) : featureToGeoJSON(this.points[data[k + OFFSET_ID]]));
            }
        }
        if (children.length === 0)
            throw clusterError;
        return children;
    }
    /**
     * Returns leaf point features under a cluster, paginated by `limit` and `offset`.
     * @param clusterId - The target cluster id.
     * @param limit - Maximum number of points to return (defaults to `10`).
     * @param offset - Number of points to skip before collecting results (defaults to `0`).
     */
    getLeaves(clusterId, limit, offset) {
        limit = limit || 10;
        offset = offset || 0;
        const leaves = [];
        this.appendLeaves(leaves, clusterId, limit, offset, 0);
        return leaves;
    }
    /**
     * Generates a vector-tile-like representation of a single tile.
     * @param z - Tile zoom.
     * @param x - Tile x coordinate.
     * @param y - Tile y coordinate.
     */
    getTile(z, x, y) {
        const tree = this.trees[this.limitZoom(z)];
        if (!tree) {
            return null;
        }
        const z2 = Math.pow(2, z);
        const { extent, radius } = this.options;
        const p = radius / extent;
        const top = (y - p) / z2;
        const bottom = (y + 1 + p) / z2;
        const tile = {
            transformed: true,
            features: [],
            source: null,
            x: x,
            y: y,
            z: z
        };
        this.addTileFeatures(tree.range((x - p) / z2, top, (x + 1 + p) / z2, bottom), tree.flatData, x, y, z2, tile);
        if (x === 0) {
            this.addTileFeatures(tree.range(1 - p / z2, top, 1, bottom), tree.flatData, z2, y, z2, tile);
        }
        if (x === z2 - 1) {
            this.addTileFeatures(tree.range(0, top, p / z2, bottom), tree.flatData, -1, y, z2, tile);
        }
        return tile;
    }
    /**
     * Returns the zoom level at which a cluster expands into multiple children.
     * @param clusterId - The target cluster id.
     */
    getClusterExpansionZoom(clusterId) {
        return this.getOriginZoom(clusterId);
    }
    appendLeaves(result, clusterId, limit, offset, skipped) {
        const children = this.getChildren(clusterId);
        for (const child of children) {
            const props = child.properties;
            if (props?.cluster) {
                if (skipped + props.point_count <= offset) {
                    // skip the whole cluster
                    skipped += props.point_count;
                }
                else {
                    // enter the cluster
                    skipped = this.appendLeaves(result, props.cluster_id, limit, offset, skipped);
                    // exit the cluster
                }
            }
            else if (skipped < offset) {
                // skip a single point
                skipped++;
            }
            else {
                // add a single point
                result.push(child);
            }
            if (result.length === limit)
                break;
        }
        return skipped;
    }
    createTree(data) {
        const tree = new KDBush(data.length / this.stride | 0, this.options.nodeSize, Float32Array);
        for (let i = 0; i < data.length; i += this.stride)
            tree.add(data[i], data[i + 1]);
        tree.finish();
        tree.flatData = data;
        tree.data = null; // clear original data to free memory as it isn't used later on.
        return tree;
    }
    addTileFeatures(ids, data, x, y, z2, tile) {
        for (const i of ids) {
            const k = i * this.stride;
            const isCluster = data[k + OFFSET_NUM] > 1;
            let tags;
            let px;
            let py;
            if (isCluster) {
                tags = getClusterProperties(data, k, this.clusterProps);
                px = data[k];
                py = data[k + 1];
            }
            else {
                const p = this.points[data[k + OFFSET_ID]];
                tags = p.tags;
                [px, py] = p.geometry;
            }
            const f = {
                type: 1,
                geometry: [[
                        Math.round(this.options.extent * (px * z2 - x)),
                        Math.round(this.options.extent * (py * z2 - y))
                    ]],
                tags
            };
            // assign id
            let id;
            if (isCluster || this.options.generateId) {
                // optionally generate id for points
                id = data[k + OFFSET_ID];
            }
            else {
                // keep id if already assigned
                id = this.points[data[k + OFFSET_ID]].id;
            }
            if (id !== undefined)
                f.id = id;
            tile.features.push(f);
        }
    }
    limitZoom(z) {
        return Math.max(this.options.minZoom, Math.min(Math.floor(+z), this.options.maxZoom + 1));
    }
    cluster(tree, zoom) {
        const { radius, extent, reduce, minPoints } = this.options;
        const r = radius / (extent * Math.pow(2, zoom));
        const data = tree.flatData;
        const nextData = [];
        const stride = this.stride;
        // loop through each point
        for (let i = 0; i < data.length; i += stride) {
            // if we've already visited the point at this zoom level, skip it
            if (data[i + OFFSET_ZOOM] <= zoom)
                continue;
            data[i + OFFSET_ZOOM] = zoom;
            // find all nearby points
            const x = data[i];
            const y = data[i + 1];
            const neighborIds = tree.within(data[i], data[i + 1], r);
            const numPointsOrigin = data[i + OFFSET_NUM];
            let numPoints = numPointsOrigin;
            // count the number of points in a potential cluster
            for (const neighborId of neighborIds) {
                const k = neighborId * stride;
                // filter out neighbors that are already processed
                if (data[k + OFFSET_ZOOM] > zoom)
                    numPoints += data[k + OFFSET_NUM];
            }
            // if there were neighbors to merge, and there are enough points to form a cluster
            if (numPoints > numPointsOrigin && numPoints >= minPoints) {
                let wx = x * numPointsOrigin;
                let wy = y * numPointsOrigin;
                let clusterProperties;
                let clusterPropIndex = -1;
                // encode both zoom and point index on which the cluster originated -- offset by total length of features
                const id = ((i / stride | 0) << 5) + (zoom + 1) + this.points.length;
                for (const neighborId of neighborIds) {
                    const k = neighborId * stride;
                    if (data[k + OFFSET_ZOOM] <= zoom)
                        continue;
                    data[k + OFFSET_ZOOM] = zoom; // save the zoom (so it doesn't get processed twice)
                    const numPoints2 = data[k + OFFSET_NUM];
                    wx += data[k] * numPoints2; // accumulate coordinates for calculating weighted center
                    wy += data[k + 1] * numPoints2;
                    data[k + OFFSET_PARENT] = id;
                    if (reduce) {
                        if (!clusterProperties) {
                            clusterProperties = this.map(data, i, true);
                            clusterPropIndex = this.clusterProps.length;
                            this.clusterProps.push(clusterProperties);
                        }
                        reduce(clusterProperties, this.map(data, k));
                    }
                }
                data[i + OFFSET_PARENT] = id;
                nextData.push(wx / numPoints, wy / numPoints, Infinity, id, -1, numPoints);
                if (reduce)
                    nextData.push(clusterPropIndex);
            }
            else { // left points as unclustered
                for (let j = 0; j < stride; j++)
                    nextData.push(data[i + j]);
                if (numPoints > 1) {
                    for (const neighborId of neighborIds) {
                        const k = neighborId * stride;
                        if (data[k + OFFSET_ZOOM] <= zoom)
                            continue;
                        data[k + OFFSET_ZOOM] = zoom;
                        for (let j = 0; j < stride; j++)
                            nextData.push(data[k + j]);
                    }
                }
            }
        }
        return nextData;
    }
    // get index of the point from which the cluster originated
    getOriginId(clusterId) {
        return (clusterId - this.points.length) >> 5;
    }
    // get zoom of the point from which the cluster originated
    getOriginZoom(clusterId) {
        return (clusterId - this.points.length) % 32;
    }
    map(data, i, clone) {
        if (data[i + OFFSET_NUM] > 1) {
            const props = this.clusterProps[data[i + OFFSET_PROP]];
            return clone ? Object.assign({}, props) : props;
        }
        const original = this.points[data[i + OFFSET_ID]].tags;
        const result = this.options.map(original);
        return clone && result === original ? Object.assign({}, result) : result;
    }
}
function getClusterFeature(data, i, clusterProps) {
    return {
        id: data[i + OFFSET_ID],
        type: 'Point',
        tags: getClusterProperties(data, i, clusterProps),
        geometry: [data[i], data[i + 1]]
    };
}
function getClusterGeoJSON(data, i, clusterProps) {
    return {
        type: 'Feature',
        id: data[i + OFFSET_ID],
        properties: getClusterProperties(data, i, clusterProps),
        geometry: {
            type: 'Point',
            coordinates: [unprojectX(data[i]), unprojectY(data[i + 1])]
        }
    };
}
function getClusterProperties(data, i, clusterProps) {
    const count = data[i + OFFSET_NUM];
    const abbrev = count >= 10000 ? `${Math.round(count / 1000)}k` :
        count >= 1000 ? `${Math.round(count / 100) / 10}k` : count;
    const propIndex = data[i + OFFSET_PROP];
    const properties = propIndex === -1 ? {} : Object.assign({}, clusterProps[propIndex]);
    return Object.assign(properties, {
        cluster: true,
        cluster_id: data[i + OFFSET_ID],
        point_count: count,
        point_count_abbreviated: abbrev
    });
}

const GEOJSONVT_CLIP_START = 'geojsonvt_clip_start';
const GEOJSONVT_CLIP_END = 'geojsonvt_clip_end';
/**
 * Creates a tile object from the given features
 * @param features - the features to include in the tile
 * @param z
 * @param tx
 * @param ty
 * @param options - the options object
 * @returns the created tile
 */
function createTile(features, z, tx, ty, options) {
    const tolerance = z === options.maxZoom ? 0 : options.tolerance / ((1 << z) * options.extent);
    const tile = {
        transformed: false,
        features: [],
        source: null,
        x: tx,
        y: ty,
        z: z,
        minX: 2,
        minY: 1,
        maxX: -1,
        maxY: 0,
        numPoints: 0,
        numSimplified: 0,
        numFeatures: features.length
    };
    for (const feature of features) {
        addFeature(tile, feature, tolerance, options);
    }
    return tile;
}
function addFeature(tile, feature, tolerance, options) {
    tile.minX = Math.min(tile.minX, feature.minX);
    tile.minY = Math.min(tile.minY, feature.minY);
    tile.maxX = Math.max(tile.maxX, feature.maxX);
    tile.maxY = Math.max(tile.maxY, feature.maxY);
    switch (feature.type) {
        case 'Point':
        case 'MultiPoint':
            addPointsTileFeature(tile, feature);
            return;
        case 'LineString':
            addLineTileFeautre(tile, feature, tolerance, options);
            return;
        case 'MultiLineString':
        case 'Polygon':
            addLinesTileFeature(tile, feature, tolerance);
            return;
        case 'MultiPolygon':
            addMultiPolygonTileFeature(tile, feature, tolerance);
            return;
    }
}
function addPointsTileFeature(tile, feature) {
    const geometry = [];
    for (let i = 0; i < feature.geometry.length; i += 3) {
        geometry.push(feature.geometry[i], feature.geometry[i + 1]);
        tile.numPoints++;
        tile.numSimplified++;
    }
    if (!geometry.length)
        return;
    const tileFeature = {
        type: 1,
        tags: feature.tags || null,
        geometry: geometry
    };
    if (feature.id !== null) {
        tileFeature.id = feature.id;
    }
    tile.features.push(tileFeature);
}
function addLineTileFeautre(tile, feature, tolerance, options) {
    const geometry = [];
    addLine(geometry, feature.geometry, tile, tolerance, false, false);
    if (!geometry.length)
        return;
    let tags = feature.tags || null;
    if (options.lineMetrics) {
        tags = {};
        for (const key in feature.tags)
            tags[key] = feature.tags[key];
        tags[GEOJSONVT_CLIP_START] = feature.geometry.start / feature.geometry.size;
        tags[GEOJSONVT_CLIP_END] = feature.geometry.end / feature.geometry.size;
    }
    const tileFeature = {
        type: 2,
        tags: tags,
        geometry: geometry
    };
    if (feature.id !== null) {
        tileFeature.id = feature.id;
    }
    tile.features.push(tileFeature);
}
function addLinesTileFeature(tile, feature, tolerance) {
    const geometry = [];
    for (let i = 0; i < feature.geometry.length; i++) {
        addLine(geometry, feature.geometry[i], tile, tolerance, feature.type === 'Polygon', i === 0);
    }
    if (!geometry.length)
        return;
    const tileFeature = {
        type: feature.type === 'Polygon' ? 3 : 2,
        tags: feature.tags || null,
        geometry: geometry
    };
    if (feature.id !== null) {
        tileFeature.id = feature.id;
    }
    tile.features.push(tileFeature);
}
function addMultiPolygonTileFeature(tile, feature, tolerance) {
    const geometry = [];
    for (let k = 0; k < feature.geometry.length; k++) {
        const polygon = feature.geometry[k];
        for (let i = 0; i < polygon.length; i++) {
            addLine(geometry, polygon[i], tile, tolerance, true, i === 0);
        }
    }
    if (!geometry.length)
        return;
    const tileFeature = {
        type: 3,
        tags: feature.tags || null,
        geometry: geometry
    };
    if (feature.id !== null) {
        tileFeature.id = feature.id;
    }
    tile.features.push(tileFeature);
}
function addLine(result, geom, tile, tolerance, isPolygon, isOuter) {
    const sqTolerance = tolerance * tolerance;
    if (tolerance > 0 && (geom.size < (isPolygon ? sqTolerance : tolerance))) {
        tile.numPoints += geom.points.length / 3;
        return;
    }
    const ring = [];
    for (let i = 0; i < geom.points.length; i += 3) {
        if (tolerance === 0 || geom.points[i + 2] > sqTolerance) {
            tile.numSimplified++;
            ring.push(geom.points[i], geom.points[i + 1]);
        }
        tile.numPoints++;
    }
    if (isPolygon)
        rewind(ring, isOuter);
    result.push(ring);
}
function rewind(ring, clockwise) {
    let area = 0;
    for (let i = 0, len = ring.length, j = len - 2; i < len; j = i, i += 2) {
        area += (ring[i] - ring[j]) * (ring[i + 1] + ring[j + 1]);
    }
    if (area > 0 !== clockwise)
        return;
    for (let i = 0, len = ring.length; i < len / 2; i += 2) {
        const x = ring[i];
        const y = ring[i + 1];
        ring[i] = ring[len - 2 - i];
        ring[i + 1] = ring[len - 1 - i];
        ring[len - 2 - i] = x;
        ring[len - 1 - i] = y;
    }
}

/**
 * Transforms the coordinates of each feature in the given tile from
 * mercator-projected space into (extent x extent) tile space.
 * @param tile - the tile to transform, this gets modified in place
 * @param extent - the tile extent (usually 4096)
 * @returns the transformed tile
 */
function transformTile(tile, extent) {
    if (tile.transformed) {
        return tile;
    }
    const z2 = 1 << tile.z;
    const tx = tile.x;
    const ty = tile.y;
    for (const feature of tile.features) {
        if (feature.type === 1) {
            transformPointFeature(feature, extent, z2, tx, ty);
        }
        else {
            transformNonPointFeature(feature, extent, z2, tx, ty);
        }
    }
    tile.transformed = true;
    return tile;
}
/**
 * Transforms a single point feature from mercator-projected space into (extent x extent) tile space.
 */
function transformPointFeature(feature, extent, z2, tx, ty) {
    const transformed = feature;
    const geometry = feature.geometry;
    const point = [];
    for (let i = 0; i < geometry.length; i += 2) {
        point.push(transformPoint(geometry[i], geometry[i + 1], extent, z2, tx, ty));
    }
    transformed.geometry = point;
    return transformed;
}
/**
 * Transforms a single non-point feature from mercator-projected space into (extent x extent) tile space.
 */
function transformNonPointFeature(feature, extent, z2, tx, ty) {
    const transformed = feature;
    const geometry = feature.geometry;
    const nonPoint = [];
    for (const geom of geometry) {
        const ring = [];
        for (let i = 0; i < geom.length; i += 2) {
            ring.push(transformPoint(geom[i], geom[i + 1], extent, z2, tx, ty));
        }
        nonPoint.push(ring);
    }
    transformed.geometry = nonPoint;
    return transformed;
}
function transformPoint(x, y, extent, z2, tx, ty) {
    return [
        Math.round(extent * (x * z2 - tx)),
        Math.round(extent * (y * z2 - ty))
    ];
}

class TileIndex {
    constructor(options) {
        this.options = options;
        this.total = 0;
        /** @internal */
        this.stats = {};
        this.tiles = {};
        this.tileCoords = [];
        this.stats = {};
        this.total = 0;
    }
    initialize(features) {
        // start slicing from the top tile down
        this.splitTile(features, 0, 0, 0);
        if (this.options.debug) {
            if (features.length)
                console.log('features: %d, points: %d', this.tiles[0].numFeatures, this.tiles[0].numPoints);
            console.timeEnd('generate tiles');
            console.log('tiles generated:', this.total, JSON.stringify(this.stats));
        }
    }
    /** {@inheritdoc} */
    updateIndex(source, affected, options) {
        if (options.debug > 1) {
            console.log('invalidating tiles');
            console.time('invalidating');
        }
        this.invalidateTiles(affected);
        if (options.debug > 1)
            console.timeEnd('invalidating');
        // re-generate root tile with updated feature set
        const [z, x, y] = [0, 0, 0];
        const rootTile = createTile(source, z, x, y, options);
        rootTile.source = source;
        // update tile index with new root tile - ready for getTile calls
        const id = toID(z, x, y);
        this.tiles[id] = rootTile;
        this.tileCoords.push({ z, x, y, id });
        if (options.debug) {
            const key = `z${z}`;
            this.stats[key] = (this.stats[key] || 0) + 1;
            this.total++;
        }
    }
    /** {@inheritdoc} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getClusterExpansionZoom(_clusterId) {
        return null;
    }
    /** {@inheritdoc} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getChildren(_clusterId) {
        return null;
    }
    /** {@inheritdoc} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getLeaves(_clusterId, _limit, _offset) {
        return null;
    }
    /** {@inheritdoc} */
    getTile(z, x, y) {
        const { extent, debug } = this.options;
        const z2 = 1 << z;
        x = (x + z2) & (z2 - 1); // wrap tile x coordinate
        const id = toID(z, x, y);
        if (this.tiles[id]) {
            return transformTile(this.tiles[id], extent);
        }
        if (debug > 1)
            console.log('drilling down to z%d-%d-%d', z, x, y);
        let z0 = z;
        let x0 = x;
        let y0 = y;
        let parent;
        while (!parent && z0 > 0) {
            z0--;
            x0 = x0 >> 1;
            y0 = y0 >> 1;
            parent = this.tiles[toID(z0, x0, y0)];
        }
        if (!parent?.source)
            return null;
        // if we found a parent tile containing the original geometry, we can drill down from it
        if (debug > 1) {
            console.log('found parent tile z%d-%d-%d', z0, x0, y0);
            console.time('drilling down');
        }
        this.splitTile(parent.source, z0, x0, y0, z, x, y);
        if (debug > 1)
            console.timeEnd('drilling down');
        if (!this.tiles[id])
            return null;
        return transformTile(this.tiles[id], extent);
    }
    /**
     * splits features from a parent tile to sub-tiles.
     * z, x, and y are the coordinates of the parent tile
     * cz, cx, and cy are the coordinates of the target tile
     *
     * If no target tile is specified, splitting stops when we reach the maximum
     * zoom or the number of points is low as specified in the options.
     * @internal
     * @param features - features to split
     * @param z - tile zoom level
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @param cz - target tile zoom level
     * @param cx - target tile x coordinate
     * @param cy - target tile y coordinate
     */
    splitTile(features, z, x, y, cz, cx, cy) {
        const stack = [features, z, x, y];
        const options = this.options;
        const debug = options.debug;
        // avoid recursion by using a processing queue
        while (stack.length) {
            y = stack.pop();
            x = stack.pop();
            z = stack.pop();
            features = stack.pop();
            const z2 = 1 << z;
            const id = toID(z, x, y);
            let tile = this.tiles[id];
            if (!tile) {
                if (debug > 1)
                    console.time('creation');
                tile = this.tiles[id] = createTile(features, z, x, y, options);
                this.tileCoords.push({ z, x, y, id });
                if (debug) {
                    if (debug > 1) {
                        console.log('tile z%d-%d-%d (features: %d, points: %d, simplified: %d)', z, x, y, tile.numFeatures, tile.numPoints, tile.numSimplified);
                        console.timeEnd('creation');
                    }
                    const key = `z${z}`;
                    this.stats[key] = (this.stats[key] || 0) + 1;
                    this.total++;
                }
            }
            // save reference to original geometry in tile so that we can drill down later if we stop now
            tile.source = features;
            // if it's the first-pass tiling
            if (cz == null) {
                // stop tiling if we reached max zoom, or if the tile is too simple
                if (z === options.indexMaxZoom || tile.numPoints <= options.indexMaxPoints)
                    continue;
                // if a drilldown to a specific tile
            }
            else if (z === options.maxZoom || z === cz) {
                // stop tiling if we reached base zoom or our target tile zoom
                continue;
            }
            else if (cz != null) {
                // stop tiling if it's not an ancestor of the target tile
                const zoomSteps = cz - z;
                if (x !== cx >> zoomSteps || y !== cy >> zoomSteps)
                    continue;
            }
            // if we slice further down, no need to keep source geometry
            tile.source = null;
            if (!features.length)
                continue;
            if (debug > 1)
                console.time('clipping');
            // values we'll use for clipping
            const k1 = 0.5 * options.buffer / options.extent;
            const k2 = 0.5 - k1;
            const k3 = 0.5 + k1;
            const k4 = 1 + k1;
            let tl = null;
            let bl = null;
            let tr = null;
            let br = null;
            const left = clip(features, z2, x - k1, x + k3, AxisType.X, tile.minX, tile.maxX, options);
            const right = clip(features, z2, x + k2, x + k4, AxisType.X, tile.minX, tile.maxX, options);
            if (left) {
                tl = clip(left, z2, y - k1, y + k3, AxisType.Y, tile.minY, tile.maxY, options);
                bl = clip(left, z2, y + k2, y + k4, AxisType.Y, tile.minY, tile.maxY, options);
            }
            if (right) {
                tr = clip(right, z2, y - k1, y + k3, AxisType.Y, tile.minY, tile.maxY, options);
                br = clip(right, z2, y + k2, y + k4, AxisType.Y, tile.minY, tile.maxY, options);
            }
            if (debug > 1)
                console.timeEnd('clipping');
            stack.push(tl || [], z + 1, x * 2, y * 2);
            stack.push(bl || [], z + 1, x * 2, y * 2 + 1);
            stack.push(tr || [], z + 1, x * 2 + 1, y * 2);
            stack.push(br || [], z + 1, x * 2 + 1, y * 2 + 1);
        }
    }
    /**
     * Invalidates (removes) tiles affected by the provided features
     * @internal
     * @param features
     */
    invalidateTiles(features) {
        if (!features.length)
            return;
        const options = this.options;
        const { debug } = options;
        // calculate bounding box of all features for trivial reject
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const feature of features) {
            minX = Math.min(minX, feature.minX);
            maxX = Math.max(maxX, feature.maxX);
            minY = Math.min(minY, feature.minY);
            maxY = Math.max(maxY, feature.maxY);
        }
        // tile buffer clipping value - not halved as in splitTile above because checking against tile's own extent
        const k1 = options.buffer / options.extent;
        // track removed tile ids for o(1) lookup
        const removedLookup = new Set();
        // iterate through existing tiles and remove ones that are affected by features
        for (const id in this.tiles) {
            const tile = this.tiles[id];
            // calculate tile bounds including buffer
            const z2 = 1 << tile.z;
            const tileMinX = (tile.x - k1) / z2;
            const tileMaxX = (tile.x + 1 + k1) / z2;
            const tileMinY = (tile.y - k1) / z2;
            const tileMaxY = (tile.y + 1 + k1) / z2;
            // trivial reject if feature bounds don't intersect tile
            if (maxX < tileMinX || minX >= tileMaxX ||
                maxY < tileMinY || minY >= tileMaxY) {
                continue;
            }
            // check if any feature intersects with the tile
            let intersects = false;
            for (const feature of features) {
                if (feature.maxX >= tileMinX && feature.minX < tileMaxX &&
                    feature.maxY >= tileMinY && feature.minY < tileMaxY) {
                    intersects = true;
                    break;
                }
            }
            if (!intersects)
                continue;
            if (debug) {
                if (debug > 1) {
                    console.log('invalidate tile z%d-%d-%d (features: %d, points: %d, simplified: %d)', tile.z, tile.x, tile.y, tile.numFeatures, tile.numPoints, tile.numSimplified);
                }
                const key = `z${tile.z}`;
                this.stats[key] = (this.stats[key] || 0) - 1;
                this.total--;
            }
            delete this.tiles[id];
            removedLookup.add(id);
        }
        // remove tile coords that are no longer in the index
        if (removedLookup.size) {
            this.tileCoords = this.tileCoords.filter(c => !removedLookup.has(c.id));
        }
    }
}
function toID(z, x, y) {
    return (((1 << z) * y + x) * 32) + z;
}

const defaultOptions = {
    maxZoom: 14,
    indexMaxZoom: 5,
    indexMaxPoints: 100000,
    tolerance: 3,
    extent: 4096,
    buffer: 64,
    lineMetrics: false,
    promoteId: null,
    generateId: false,
    updateable: false,
    cluster: false,
    clusterOptions: defaultClusterOptions,
    debug: 0
};
/**
 * Main class for creating and managing a vector tile index from GeoJSON data.
 */
class GeoJSONVT {
    constructor(data, options) {
        options = this.options = Object.assign({}, defaultOptions, options);
        const debug = options.debug;
        if (debug)
            console.time('preprocess data');
        if (options.maxZoom < 0 || options.maxZoom > 24)
            throw new Error('maxZoom should be in the 0-24 range');
        if (options.promoteId && options.generateId)
            throw new Error('promoteId and generateId cannot be used together.');
        // projects and adds simplification info
        let features = convertToInternal(data, options);
        if (debug) {
            console.timeEnd('preprocess data');
            console.log('index: maxZoom: %d, maxPoints: %d', options.indexMaxZoom, options.indexMaxPoints);
            console.time('generate tiles');
        }
        // wraps features (ie extreme west and extreme east)
        features = wrap(features, options);
        // for updateable indexes, store a copy of the original simplified features
        if (options.updateable) {
            this.source = features;
        }
        this.initializeIndex(features, options);
    }
    initializeIndex(features, options) {
        this.tileIndex = options.cluster ? new ClusterTileIndex(options.clusterOptions) : new TileIndex(options);
        if (!features.length)
            return;
        this.tileIndex.initialize(features);
    }
    /**
     * Given z, x, and y tile coordinates, returns the corresponding tile with geometries in tile coordinates, much like MVT data is stored.
     * @param z - tile zoom level
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @returns the transformed tile or null if not found
     */
    getTile(z, x, y) {
        z = +z;
        x = +x;
        y = +y;
        if (z < 0 || z > 24)
            return null;
        return this.tileIndex.getTile(z, x, y);
    }
    /**
     * Updates the source data feature set using a {@link GeoJSONVTSourceDiff}
     * @param diff - the source diff object
     */
    updateData(diff, filter) {
        const options = this.options;
        if (!options.updateable)
            throw new Error('to update tile geojson `updateable` option must be set to true');
        // apply diff and collect affected features and updated source that will be used to invalidate tiles
        let { affected, source } = applySourceDiff(this.source, diff, options);
        if (filter) {
            ({ affected, source } = this.filterUpdate(source, affected, filter));
        }
        // nothing has changed
        if (!affected.length)
            return;
        // update source with new simplified feature set
        this.source = source;
        this.tileIndex.updateIndex(source, affected, options);
    }
    /**
     * Filter an update using a predicate function. Returns the affected and updated source features.
     */
    filterUpdate(source, affected, predicate) {
        const removeIds = new Set();
        for (const feature of source) {
            if (feature.id == undefined)
                continue;
            if (predicate(featureToGeoJSON(feature)))
                continue;
            affected.push(feature);
            removeIds.add(feature.id);
        }
        source = source.filter(feature => !removeIds.has(feature.id));
        return { affected, source };
    }
    /**
     * Returns source data as GeoJSON - only available when `updateable` option is set to true.
     */
    getData() {
        if (!this.options.updateable)
            throw new Error('to retrieve data the `updateable` option must be set to true');
        return convertToGeoJSON(this.source);
    }
    /**
     * Update supercluster options and regenerate the index.
     * @param cluster - whether to enable clustering
     * @param clusterOptions - {@link SuperclusterOptions}
     */
    updateClusterOptions(cluster, clusterOptions) {
        const wasCluster = this.options.cluster;
        this.options.cluster = cluster;
        this.options.clusterOptions = clusterOptions;
        if (wasCluster == cluster) {
            this.tileIndex.updateIndex(this.source, [], this.options);
            return;
        }
        this.initializeIndex(this.source, this.options);
    }
    /**
     * Returns the zoom level at which a cluster expands into multiple children.
     * @param clusterId - The target cluster id.
     * @returns the expansion zoom or null in case of non-clustered source
     */
    getClusterExpansionZoom(clusterId) {
        return this.tileIndex.getClusterExpansionZoom(clusterId);
    }
    /**
     * Returns the immediate children (clusters or points) of a cluster as GeoJSON.
     * @param clusterId - The target cluster id.
     * @returns the immediate children or null in case of non-clustered source
     */
    getClusterChildren(clusterId) {
        return this.tileIndex.getChildren(clusterId);
    }
    /**
     * Returns leaf point features under a cluster, paginated by `limit` and `offset`.
     * @param clusterId - The target cluster id.
     * @param limit - Maximum number of points to return (defaults to `10`).
     * @param offset - Number of points to skip before collecting results (defaults to `0`).
     * @returns leaf point features under a cluster or null in case of non-clustered source
     */
    getClusterLeaves(clusterId, limit, offset) {
        return this.tileIndex.getLeaves(clusterId, limit, offset);
    }
}

/**
 * Converts GeoJSON data directly to a single vector tile without building a tile index.
 *
 * Unlike the {@link GeoJSONVT} class which builds a hierarchical tile index for efficient
 * repeated tile access, this function generates a single tile on-demand. This is useful when:
 * - You only need one specific tile and don't need to query multiple tiles
 * - The source data is already spatially filtered to the tile's bounding box
 * - You want to avoid the overhead of building a full tile index
 *
 * @example
 * ```ts
 * import {geoJSONToTile} from '@maplibre/geojson-vt';
 *
 * const geojson = {
 *   type: 'FeatureCollection',
 *   features: [{
 *     type: 'Feature',
 *     geometry: { type: 'Point', coordinates: [-77.03, 38.90] },
 *     properties: { name: 'Washington, D.C.' }
 *   }]
 * };
 *
 * const tile = geoJSONToTile(geojson, 10, 292, 391, { extent: 4096 });
 * ```
 *
 * @param data - GeoJSON data (Feature, FeatureCollection, or Geometry)
 * @param z - Tile zoom level
 * @param x - Tile x coordinate
 * @param y - Tile y coordinate
 * @param options - Optional configuration for tile generation
 * @returns The generated tile with geometries in tile coordinates, or null if no features
 */
function geoJSONToTile(data, z, x, y, options = {}) {
    options = { ...defaultOptions, ...options };
    const { wrap: shouldWrap = false, clip: shouldClip = false } = options;
    let features = convertToInternal(data, options);
    if (shouldWrap) {
        features = wrap(features, options);
    }
    if (shouldClip || options.lineMetrics) {
        const pow2 = 1 << z;
        const buffer = options.buffer / options.extent;
        const left = clip(features, pow2, (x - buffer), (x + 1 + buffer), AxisType.X, -1, 2, options);
        features = clip(left || [], pow2, (y - buffer), (y + 1 + buffer), AxisType.Y, -1, 2, options);
    }
    return transformTile(createTile(features ?? [], z, x, y, options), options.extent);
}

export { GEOJSONVT_CLIP_END, GEOJSONVT_CLIP_START, GeoJSONVT, ClusterTileIndex as Supercluster, geoJSONToTile };
//# sourceMappingURL=geojson-vt.mjs.map
