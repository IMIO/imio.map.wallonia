import { BasePattern } from "@patternslib/patternslib/src/core/basepattern";
import Parser from "@patternslib/patternslib/src/core/parser";
import registry from "@patternslib/patternslib/src/core/registry";
import logging from "@patternslib/patternslib/src/core/logging";
import { LAYERS, BOUNDARIES_URL } from "./layers";

const log = logging.getLogger("wallonia-map");

export const DEFAULT_TILES_URL =
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const DEFAULT_ATTRIBUTION =
    'Carte &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> | Données &copy; <a href="https://www.ngi.be/website/fr/">NGI-IGN</a> ';

export const parser = new Parser("wallonia-map");
parser.addArgument("tiles-url", DEFAULT_TILES_URL);
parser.addArgument("attribution", DEFAULT_ATTRIBUTION);

const fetch_json = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    return response.json();
};

class Pattern extends BasePattern {
    static name = "wallonia-map";
    static trigger = ".pat-wallonia-map";
    static parser = parser;

    async init() {
        // Read the links and hide the lists before the first await.
        // The lists do not show while the data loads.
        const links_by_layer = this.read_links();
        this.lists = [...this.el.children];
        this.set_lists_hidden(true);

        import("./wallonia-map.scss");

        // An empty option gives the default value.
        const props = {
            tilesUrl: this.options.tilesUrl || DEFAULT_TILES_URL,
            attribution: this.options.attribution || DEFAULT_ATTRIBUTION,
        };

        // Start the downloads now. They run while the component loads.
        const layers = [...links_by_layer.keys()];
        const downloads = Promise.all([
            fetch_json(BOUNDARIES_URL),
            ...layers.map((layer) => fetch_json(LAYERS[layer].url)),
        ]).catch((error) => {
            log.error("Cannot load the map data.", error);
            return null;
        });

        const [{ createRoot }, { createElement }, { default: WalloniaMap }] =
            await Promise.all([
                import("react-dom/client"),
                import("react"),
                import("./WalloniaMap.jsx"),
            ]);

        // Show the map at once. The tiles do not wait for the data.
        this.container = document.createElement("div");
        this.el.append(this.container);
        this.root = createRoot(this.container);
        const render = (data) =>
            this.root.render(createElement(WalloniaMap, { ...props, ...data }));
        render({ areas: [], boundaries: null });

        const data = await downloads;
        if (!this.root) {
            // The pattern is destroyed.
            return;
        }
        if (!data) {
            // The map has no areas. The links are the only navigation.
            this.set_lists_hidden(false);
            return;
        }
        const [boundaries, ...records] = data;
        const areas = layers.flatMap((layer, index) =>
            this.match_areas(layer, links_by_layer.get(layer), records[index].records),
        );
        render({ areas, boundaries });
    }

    /**
     * Read the links of the element.
     *
     * The layer of a link is the `data-layer` of its closest ancestor that has
     * one. An ancestor above the element does not count.
     *
     * @returns {Map} - The links `{name, url}` of each known layer.
     */
    read_links() {
        const links_by_layer = new Map();
        const unknown = new Map();
        const without_layer = [];

        for (const link of this.el.querySelectorAll("a[href]")) {
            const name = link.textContent.trim();
            const holder = link.closest("[data-layer]");
            if (!holder || !this.el.contains(holder)) {
                without_layer.push(name);
                continue;
            }
            const layer = holder.dataset.layer;
            const group = Object.hasOwn(LAYERS, layer) ? links_by_layer : unknown;
            if (!group.has(layer)) {
                group.set(layer, []);
            }
            group.get(layer).push({ name, url: link.href });
        }

        if (without_layer.length) {
            log.warn(
                `Links without a data-layer, not on the map: ${without_layer.join(", ")}`,
                this.el,
            );
        }
        for (const [layer, links] of unknown) {
            const names = links.map((link) => link.name).join(", ");
            log.warn(
                `Unknown layer "${layer}", links not on the map: ${names}`,
                this.el,
            );
        }
        return links_by_layer;
    }

    /**
     * Find the area of each link. The link text must equal the name of the area.
     *
     * @param {string} layer - The name of the layer.
     * @param {Array} links - The links `{name, url}` of the layer.
     * @param {Array} records - The records of the data file of the layer.
     * @returns {Array} - One area `{layer, code, name, url, shape}` for each matched link.
     */
    match_areas(layer, links, records) {
        const { name: name_field, code: code_field } = LAYERS[layer];
        const records_by_name = new Map(
            records.map((record) => [record.fields[name_field], record]),
        );
        const areas = [];
        const not_found = [];

        for (const { name, url } of links) {
            const record = records_by_name.get(name);
            if (!record) {
                not_found.push(name);
                continue;
            }
            areas.push({
                layer,
                code: record.fields[code_field],
                name,
                url,
                shape: record.fields.geo_shape,
            });
        }

        if (not_found.length) {
            log.warn(
                `No area in layer "${layer}" for the links: ${not_found.join(", ")}`,
                this.el,
            );
        }
        return areas;
    }

    set_lists_hidden(hidden) {
        for (const list of this.lists || []) {
            list.hidden = hidden;
        }
    }

    destroy() {
        this.root?.unmount();
        this.root = null;
        this.container?.remove();
        this.set_lists_hidden(false);
        super.destroy();
    }
}

// Register the pattern in the global pattern registry.
registry.register(Pattern);

export default Pattern;
export { Pattern };
