// A layer is one kind of territory. An area is one shape in a layer.
// `name` and `code` give the record fields that hold the name and the code of an area.
// The URLs resolve relative to the bundle at runtime (webpack publicPath "auto").
// This module is separate because Jest cannot run import.meta. Tests mock it.
export const LAYERS = {
    municipalities: {
        url: new URL("./layers/municipalities.json", import.meta.url).href,
        name: "mun_name_fr",
        code: "mun_code",
    },
};
export const BOUNDARIES_URL = new URL("./wallonia-boundaries.json", import.meta.url)
    .href;
