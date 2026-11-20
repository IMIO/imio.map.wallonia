# pat-wallonia-map

## Description

Shows a map of Wallonia. Each link in the element becomes a clickable area on
the map. A click on an area opens a popup with the link.

The pattern mounts a React component that draws the map with
[Leaflet](https://leafletjs.com/) through
[React Leaflet](https://react-leaflet.js.org/).
The shapes of the areas and the boundaries of Wallonia load from the bundle.
Only the map tiles come from an external server.

## Documentation

Put the links in a list and give the name of the layer in `data-layer`.

```html
<div class="pat-wallonia-map">
  <ul data-layer="municipalities">
    <li><a href="https://site/namur">Namur</a></li>
    <li><a href="https://site/liege">Liège</a></li>
  </ul>
</div>

<!-- With options. Use the JSON notation: it is safe for any URL and for HTML. -->
<div
  class="pat-wallonia-map"
  data-pat-wallonia-map='{"tiles-url": "https://tiles.site/{z}/{x}/{y}.png", "attribution": "&amp;copy; Site"}'
>
  <ul data-layer="municipalities">
    <li><a href="https://site/namur">Namur</a></li>
  </ul>
</div>
```

The pattern reads each `<a href>` in the element:

- The layer of a link is the `data-layer` of its closest ancestor that has one.
  An ancestor above the pattern element does not count.
- The text of the link is the name of the area. It must be equal to the name in
  the data file of the layer (same case, same accents).
- The `href` of the link is the target of the popup link.

The pattern hides the child elements of the element and adds the map after
them. Without JavaScript, the lists stay visible. If the data does not load,
the pattern logs an error and shows the lists again.

The pattern logs a warning and continues in these cases. Each warning lists
the names of the links that are not on the map:

- Links that have no `data-layer`.
- Links in a layer that does not exist (one warning for each layer).
- Links with a name that matches no area (one warning for each layer).

The popup link uses the Bootstrap class `text-primary`. The pattern does not
include Bootstrap: the page must load it.

### Options reference

| Property    | Default value                                                    | Values | Type   | Description                                                                 |
| ----------- | ---------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------- |
| tiles-url   | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` |        | String | URL template of the map tiles. If empty, the default value is used.         |
| attribution | `Carte © OpenStreetMap \| Données © NGI-IGN` (with links)        |        | String | HTML of the attribution on the map. If empty, the default value is used.    |

## Layers

A layer is one kind of territory. An area is one shape in a layer.

Each layer has one data file in `layers/`. The file stays as the source
publishes it: do not edit it and do not change its format. Webpack emits it
as a separate file and the pattern downloads it only when the markup names
the layer.

`layers.js` declares each layer: the data file, the record field that holds
the name of an area and the record field that holds its code.

```js
municipalities: {
    url: new URL("./layers/municipalities.json", import.meta.url).href,
    name: "mun_name_fr",
    code: "mun_code",
},
```

The pattern reads the records in `records`, the name and the code in
`fields`, and the shape (a GeoJSON geometry) in `fields.geo_shape`.

Only the `municipalities` layer exists.

| Layer          | Data file                    | Name field    | Code field |
| -------------- | ---------------------------- | ------------- | ---------- |
| municipalities | `layers/municipalities.json` | `mun_name_fr` | `mun_code` |
