# Measure tools: the measurement panel

The parcel page (`view-land-parcel`) has a **Measure tools** menu on the map. Choose "Measure a distance" or "Measure an area" and the panel on the left of the map shows the measurement as you draw. The panel heading names the tool in use: **Distance** or **Area**.

## Distance panel

Shows the length of the line you drew in **metres**, rounded to the nearest whole metre. This matches the "Length (m)" column in the Hedgerows table.

## Area panel

Example:

> **Area**
> **1.9638 ha**
> 19,638 m² · perimeter 669 m

The panel shows the same area in two units, then the length of the shape's edge.

### 1.9638 ha

The area inside the shape you drew, in **hectares**. One hectare is 10,000 m², roughly the size of a rugby pitch. It's shown to 4 decimal places, the same as the "Area (ha)" column in the Land covers table and the "Total area (ha)" in the summary, so the figures can be compared directly.

### 19,638 m²

The same area in **square metres**, rounded to the nearest whole m². It's 1.9638 × 10,000, so it adds no new information. It's there because hectares are hard to picture for small shapes: 0.0113 ha is easier to understand as 113 m².

### Perimeter 669 m

The distance all the way around the edge of the shape, rounded to the nearest metre. It includes the closing side from your last point back to your first. It's useful for questions like "how much fencing or hedging would go round this?"

## How the figures are worked out

Both figures are calculated on the curved surface of the Earth, using the same method as the map component's own area check (the `@turf/area` formula).

The RPA's published parcel and land cover areas are usually measured on the flat British National Grid. Tracing an existing land cover will therefore give a figure that's very close but may differ slightly in the last decimal place. Most of the difference comes from where you place the points, not the maths.

## Open question for research

If research shows the second line (m² and perimeter) isn't needed, it could be cut back to just the hectares, or show m² only for small areas.
