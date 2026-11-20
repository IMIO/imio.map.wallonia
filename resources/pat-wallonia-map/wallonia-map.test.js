import Pattern, { DEFAULT_ATTRIBUTION, DEFAULT_TILES_URL } from "./wallonia-map";
import utils from "@patternslib/patternslib/src/core/utils";

// jsdom has no layout: Leaflet cannot draw tiles or shapes. Mock at the
// react-leaflet boundary. Each mock renders its props as plain elements.
jest.mock("./layers", () => ({
    LAYERS: {
        municipalities: {
            url: "municipalities.json",
            name: "mun_name_fr",
            code: "mun_code",
        },
    },
    BOUNDARIES_URL: "boundaries.json",
}));
jest.mock("react-leaflet", () => {
    const { createElement } = require("react");
    return {
        MapContainer: ({ children }) =>
            createElement("div", { className: "map" }, children),
        ZoomControl: () => null,
        TileLayer: ({ url, attribution }) =>
            createElement("div", {
                "className": "tiles",
                "data-url": url,
                "data-attribution": attribution,
            }),
        GeoJSON: ({ data, children }) =>
            createElement(
                "div",
                { "className": "area", "data-shape": JSON.stringify(data) },
                children,
            ),
        Popup: ({ children }) => createElement("div", { className: "popup" }, children),
    };
});
const mockMap = { addLayer: jest.fn(), removeLayer: jest.fn() };
jest.mock("@react-leaflet/core", () => ({
    useLeafletContext: () => ({ map: mockMap }),
}));

const shape = (x, y) => ({
    type: "Polygon",
    coordinates: [
        [
            [x, y],
            [x + 0.1, y],
            [x, y + 0.1],
            [x, y],
        ],
    ],
});
const MUNICIPALITIES = {
    records: [
        {
            fields: {
                mun_name_fr: "Namur",
                mun_code: "92094",
                geo_shape: shape(4.8, 50.4),
            },
        },
        {
            fields: {
                mun_name_fr: "Dinant",
                mun_code: "91034",
                geo_shape: shape(4.9, 50.2),
            },
        },
    ],
};
const BOUNDARIES = {
    type: "Feature",
    geometry: {
        type: "Polygon",
        coordinates: [
            [3, 50],
            [6, 50],
            [6, 51],
            [3, 51],
        ],
    },
};

// Let the pattern init, the lazy imports, the downloads and the React render complete.
const settle = async () => {
    for (let i = 0; i < 5; i++) {
        await utils.timeout(10);
    }
};

const mount = async (html) => {
    document.body.innerHTML = html;
    const el = document.querySelector(".pat-wallonia-map");
    const instance = new Pattern(el);
    await settle();
    return { el, instance };
};

// The logger gives its name first, then the message.
const warnings = (warn) => warn.mock.calls.map((call) => call[1]);

describe("pat-wallonia-map", () => {
    let warn;

    beforeEach(() => {
        document.body.innerHTML = "";
        jest.clearAllMocks();
        warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        global.fetch = jest.fn(async (url) => ({
            ok: true,
            json: async () =>
                url === "municipalities.json" ? MUNICIPALITIES : BOUNDARIES,
        }));
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it("matches the areas from the links under data-layer", async () => {
        const { el } = await mount(`
            <div class="pat-wallonia-map">
                <ul data-layer="municipalities">
                    <li><a href="https://example.org/dinant"> Dinant </a></li>
                    <li><a href="https://example.org/namur">Namur</a></li>
                </ul>
            </div>
        `);

        expect(fetch.mock.calls.map((call) => call[0]).sort()).toEqual([
            "boundaries.json",
            "municipalities.json",
        ]);

        const areas = [...el.querySelectorAll(".map .area")];
        expect(areas.map((area) => JSON.parse(area.dataset.shape))).toEqual([
            shape(4.9, 50.2),
            shape(4.8, 50.4),
        ]);
        const links = areas.map((area) => area.querySelector(".popup a"));
        expect(links.map((link) => link.textContent)).toEqual(["Dinant", "Namur"]);
        expect(links.map((link) => link.getAttribute("href"))).toEqual([
            "https://example.org/dinant",
            "https://example.org/namur",
        ]);

        // The mask of the boundaries is on the map.
        expect(mockMap.addLayer).toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });

    it("loads only the layers that the markup names", async () => {
        const { el } = await mount(`<div class="pat-wallonia-map"></div>`);

        expect(fetch.mock.calls.map((call) => call[0])).toEqual(["boundaries.json"]);
        expect(el.querySelector(".map")).toBeTruthy();
        expect(el.querySelector(".area")).toBeNull();
    });

    it("uses the default options", async () => {
        const { el } = await mount(`
            <div class="pat-wallonia-map" data-pat-wallonia-map='{"tiles-url": ""}'></div>
        `);

        const tiles = el.querySelector(".tiles");
        expect(tiles.dataset.url).toBe(DEFAULT_TILES_URL);
        expect(tiles.dataset.attribution).toBe(DEFAULT_ATTRIBUTION);
    });

    it("gives the options to the component", async () => {
        const { el } = await mount(`
            <div class="pat-wallonia-map"
                 data-pat-wallonia-map='{
                    "tiles-url": "https://tiles.example.org/{z}/{x}/{y}.png",
                    "attribution": "Carte: Example"
                 }'></div>
        `);

        const tiles = el.querySelector(".tiles");
        expect(tiles.dataset.url).toBe("https://tiles.example.org/{z}/{x}/{y}.png");
        expect(tiles.dataset.attribution).toBe("Carte: Example");
    });

    it("warns one time about the links without a data-layer", async () => {
        const { el } = await mount(`
            <div data-layer="municipalities">
                <div class="pat-wallonia-map">
                    <a href="https://example.org/namur">Namur</a>
                    <a href="https://example.org/dinant">Dinant</a>
                </div>
            </div>
        `);

        expect(warnings(warn)).toEqual([
            "Links without a data-layer, not on the map: Namur, Dinant",
        ]);
        expect(el.querySelector(".area")).toBeNull();
    });

    it("warns one time for each unknown layer", async () => {
        const { el } = await mount(`
            <div class="pat-wallonia-map">
                <ul data-layer="provinces">
                    <li><a href="https://example.org/namur">Namur</a></li>
                    <li><a href="https://example.org/liege">Liège</a></li>
                </ul>
                <ul data-layer="police-zones">
                    <li><a href="https://example.org/zone">Zone 1</a></li>
                </ul>
            </div>
        `);

        expect(warnings(warn)).toEqual([
            'Unknown layer "provinces", links not on the map: Namur, Liège',
            'Unknown layer "police-zones", links not on the map: Zone 1',
        ]);
        expect(fetch.mock.calls.map((call) => call[0])).toEqual(["boundaries.json"]);
        expect(el.querySelector(".area")).toBeNull();
    });

    it("warns one time for each layer about the names with no area", async () => {
        const { el } = await mount(`
            <div class="pat-wallonia-map">
                <ul data-layer="municipalities">
                    <li><a href="https://example.org/a">Atlantis</a></li>
                    <li><a href="https://example.org/namur">Namur</a></li>
                    <li><a href="https://example.org/b">namur</a></li>
                </ul>
            </div>
        `);

        expect(warnings(warn)).toEqual([
            'No area in layer "municipalities" for the links: Atlantis, namur',
        ]);
        expect(el.querySelectorAll(".area").length).toBe(1);
    });

    it("hides the lists and keeps them in the page", async () => {
        const { el } = await mount(`
            <div class="pat-wallonia-map">
                <ul data-layer="municipalities">
                    <li><a href="https://example.org/namur">Namur</a></li>
                </ul>
                <ul data-layer="provinces">
                    <li><a href="https://example.org/liege">Liège</a></li>
                </ul>
            </div>
        `);

        const lists = [...el.querySelectorAll("ul")];
        expect(lists.length).toBe(2);
        expect(lists.every((list) => list.hidden)).toBe(true);
        expect(el.querySelector(".map").closest("[hidden]")).toBeNull();
    });

    it("shows the lists again when the data does not load", async () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => {});
        global.fetch = jest.fn(async () => ({ ok: false, status: 404, statusText: "" }));

        const { el } = await mount(`
            <div class="pat-wallonia-map">
                <ul data-layer="municipalities">
                    <li><a href="https://example.org/namur">Namur</a></li>
                </ul>
            </div>
        `);

        expect(el.querySelector("ul").hidden).toBe(false);
        expect(el.querySelector(".map")).toBeTruthy();
        expect(String(error.mock.calls[0])).toContain("Cannot load the map data.");
        error.mockRestore();
    });

    it("unmounts on destroy", async () => {
        const { el, instance } = await mount(`
            <div class="pat-wallonia-map">
                <ul data-layer="municipalities">
                    <li><a href="https://example.org/namur">Namur</a></li>
                </ul>
            </div>
        `);
        expect(el.querySelector(".map")).toBeTruthy();

        instance.destroy();

        expect(el.querySelector(".map")).toBeNull();
        expect(el.children.length).toBe(1);
        expect(el.querySelector("ul").hidden).toBe(false);
        expect(el["pattern-wallonia-map"]).toBeUndefined();
    });
});
