# imio.map.wallonia

A map of Wallonia for Plone 6 Classic UI, shipped as a
[patternslib](https://patternslib.com/) pattern: `pat-wallonia-map`.

The pattern shows a [Leaflet](https://leafletjs.com/) map of Wallonia. The page
gives lists of links. The map shows each link on its area: for example, a link
named `Namur` goes on the municipality of Namur.

The add-on knows nothing about the content of the site. It ships the map, the
borders and the pattern. The page that uses the pattern gives the links.

## Usage

Install the add-on (`imio.map.wallonia:default` profile), then add the pattern
to a template:

```html
<div class="pat-wallonia-map">
  <ul data-layer="municipalities">
    <li><a href="https://example.org/namur">Namur</a></li>
    <li><a href="https://example.org/liege">Liège</a></li>
  </ul>
</div>
```

Two words are used in this documentation:

- A **layer** is one kind of territory. The only layer is `municipalities`.
- An **area** is one shape in a layer: one municipality.

The `tiles-url` and `attribution` options are optional. Use the JSON notation:
it is safe for any URL.

```html
<div class="pat-wallonia-map"
     data-pat-wallonia-map='{"tiles-url": "https://tiles.example.org/{z}/{x}/{y}.png", "attribution": "© Example"}'>
  ...
</div>
```

The default basemap is the CARTO light basemap, with an OpenStreetMap and
NGI-IGN attribution. See
[the pattern documentation](resources/pat-wallonia-map/documentation.md).

Requirements on the page:

- Each link is in an element that has a `data-layer` attribute. The attribute
  gives the name of the layer.
- The text of the link is the name of the area. For the `municipalities`
  layer, it is the French name of the municipality: `Liège`, not `Luik`.
- The browser can reach the tile server.

A link with no layer, with an unknown layer or with an unknown name is not
shown on the map. The pattern logs a warning in the browser console.

Without JavaScript, the lists of links stay visible.

The pattern brings its own stylesheet. It needs no icon font.

To try the map on a site where the add-on is installed, open
`@@walloniamap-demo`.

## Data

The data files ship as is in the bundle:

- `resources/pat-wallonia-map/layers/municipalities.json`: the borders of the
  261 municipalities of the Walloon Region. It is the opendatasoft
  `georef-belgium-municipality` dataset (year 2025), limited to the Walloon
  Region. The file is about 10 MB.
- `resources/pat-wallonia-map/wallonia-boundaries.json`: the border of
  Wallonia.

The browser downloads these files from the Plone site, not from a third party.
If borders change, for example after a merge of municipalities, a new release
of the add-on brings the new files.

## Why Module Federation

The `plone` bundle (mockup) is a webpack Module Federation **host**. When the
DOM is ready, it finds each `window.__patternslib_mf__*` global, initialises
that remote (this runs our `registry.register(...)`), and then scans the DOM
for `pat-*` classes. The packages in the `dependencies` of `package.json`, and
those of patternslib and mockup, become **shared singletons**: there is one
pattern registry and one jQuery for all the remotes on the page.

This add-on is such a remote. Its Plone bundle
(`plone.bundles/imio.map.wallonia`) points to
`imio.map.wallonia-remote.min.js`. The chunks and the data files resolve
relative to that script (webpack `publicPath: "auto"`), so a
`++plone++imio.map.wallonia` resource directory is all the add-on needs.

`@patternslib/patternslib` and `@plone/mockup` are pinned to the versions of
`plone.staticresources` in the target Plone release (Plone 6.2.2:
`plone.staticresources` 3.0.6, `@plone/mockup` 5.6.10,
`@patternslib/patternslib` 9.10.7). Shared singletons check the version: with
a major mismatch, the remote falls back to its own copy.

## Development

The built bundle is in `src/imio/map/wallonia/browser/static/bundles/` and is
committed: installing the Python package does not need Node.js. CI rebuilds it
and fails if the committed files are not up to date.

JavaScript (Node.js 20 or later):

```sh
npm install
npm test            # Jest
npm run lint        # ESLint
npm start           # demo page and bundle on http://localhost:3002
npm run build       # writes static/bundles/: commit the result
```

To use the `npm start` bundle in a Plone site, enable the
`plone.bundles/imio.map.wallonia-devserver` registry record and disable
`plone.bundles/imio.map.wallonia` (Site Setup > Resource Registries).

Python (uses [uv](https://docs.astral.sh/uv/)):

```sh
make install        # virtualenv with Plone and the test dependencies
make test           # pytest
make create-site    # Plone site with the add-on installed
make start          # http://localhost:8080
make check          # format and lint
```

`make help` lists all the targets, including `js-build`, `js-start` and
`js-test`.

## License

GPL version 2. See [LICENSE.md](LICENSE.md).
