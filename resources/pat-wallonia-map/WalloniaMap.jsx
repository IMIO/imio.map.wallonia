import { useState, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, GeoJSON, Popup } from "react-leaflet";

import { Mask } from "./LeafletMask";

// The "circle chevron right" icon, drawn in a 24 x 24 view box.
const CHEVRON_PATH =
    "M22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12M10,18L16,12L10,6L8.6,7.4L13.2,12L8.6,16.6L10,18Z";

/**
 * Show a Leaflet map of Wallonia with one shape for each area.
 * A click on an area opens a popup with the link of the area.
 */
const WalloniaMap = ({ areas, boundaries, tilesUrl, attribution }) => {
    const [selectedAreaKey, setSelectedAreaKey] = useState();

    const height = window.innerWidth < 1000 ? "400px" : "750px";
    // MapContainer reads the zoom only when it mounts.
    let defaultZoom = 9;
    if (window.innerWidth < 600) {
        defaultZoom = 7;
    } else if (window.innerWidth < 1000) {
        defaultZoom = 8;
    }
    const center = [50.16, 4.65];
    const maxBounds = [
        [54, 10],
        [46, 0],
    ];
    const defaultPathOption = { weight: 1.5, color: "#DE007B", fillOpacity: 0.1 };
    const selectedPathOption = { weight: 1.5, color: "#DE007B", fillOpacity: 0.8 };

    const resetSelectedAreaKey = useCallback(() => {
        setSelectedAreaKey(null);
    }, []);

    return (
        <MapContainer
            center={center}
            maxBounds={maxBounds}
            zoom={defaultZoom}
            minZoom={5}
            maxZoom={13}
            scrollWheelZoom={false}
            zoomControl={false}
            style={{ height: height }}
        >
            <ZoomControl position={"bottomright"} />
            <TileLayer attribution={attribution} url={tilesUrl} />
            {boundaries && <Mask data={boundaries} />}
            {areas &&
                areas.map((area) => {
                    const areaKey = `${area.layer}:${area.code}`;
                    return (
                        <GeoJSON
                            key={areaKey}
                            pathOptions={
                                areaKey === selectedAreaKey
                                    ? selectedPathOption
                                    : defaultPathOption
                            }
                            data={area.shape}
                            eventHandlers={{
                                click: () => {
                                    setSelectedAreaKey(areaKey);
                                },
                            }}
                        >
                            <Popup closeButton={false} onClose={resetSelectedAreaKey}>
                                <a
                                    className={"text-primary"}
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                    href={area.url}
                                >
                                    {area.name}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width={24}
                                        height={15}
                                        viewBox="0 0 24 24"
                                        style={{ fill: "#DE007B" }}
                                    >
                                        <path d={CHEVRON_PATH} />
                                    </svg>
                                </a>
                            </Popup>
                        </GeoJSON>
                    );
                })}
        </MapContainer>
    );
};

export default WalloniaMap;
