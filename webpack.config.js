process.traceDeprecation = true;
const path = require("path");
const mf_config = require("@patternslib/dev/webpack/webpack.mf");
const webpack_config = require("@patternslib/dev/webpack/webpack.config").config;
const package_json = require("./package.json");
const package_json_mockup = require("@plone/mockup/package.json");
const package_json_patternslib = require("@patternslib/patternslib/package.json");

// The iMio add-ons share one React with these entries, in addition to
// "react" and "react-dom". Each add-on has the same version of react and
// react-dom. The page takes the highest version of each entry, so react and
// react-dom/client always have the same version.
const shared_react = {
    "react-dom/client": {
        singleton: true,
        requiredVersion: package_json.dependencies["react-dom"],
    },
    "react/jsx-runtime": {
        singleton: true,
        requiredVersion: package_json.dependencies.react,
    },
};

module.exports = () => {
    let config = {
        context: __dirname,
        entry: {
            "imio.map.wallonia.min": path.resolve(__dirname, "resources/index.js"),
        },
    };

    config = webpack_config({ config, package_json });
    config.output.path = path.resolve(
        __dirname,
        "src/imio/map/wallonia/browser/static/bundles",
    );

    // Compile JSX with babel and resolve .jsx imports.
    const babel_rule = config.module.rules.find((r) => r.loader === "babel-loader");
    babel_rule.test = /\.jsx?$/;
    config.resolve.extensions = [".js", ".jsx", ".json"];

    // Emit the data files as they are. The pattern downloads them with fetch.
    // Webpack does not parse them and does not put them in a chunk.
    config.module.rules.push({
        test: /\.json$/i,
        dependency: "url",
        type: "asset/resource",
    });

    // Keep the source name in the file names of the data files.
    config.output.assetModuleFilename = "[name].[contenthash][ext]";

    // The data file of a layer is large. Size hints give no useful information here.
    config.performance = { hints: false };

    config.plugins.push(
        mf_config({
            // Exposed as window.__patternslib_mf__imiomapwallonia
            name: "imio.map.wallonia",
            filename: "imio.map.wallonia-remote.min.js",
            // Relative to the webpack context. An absolute path changes the
            // module ids on each machine.
            remote_entry: "./resources/index.js",
            dependencies: {
                ...package_json_patternslib.dependencies,
                ...package_json_mockup.dependencies,
                ...package_json.dependencies,
            },
            shared: shared_react,
        }),
    );

    if (process.env.NODE_ENV === "development") {
        config.devServer.port = "3002";
        config.devServer.static.directory = path.resolve(__dirname, "./resources/");
    }
    return config;
};
