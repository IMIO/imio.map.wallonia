from pathlib import Path

import imio.map.wallonia
import pytest


BUNDLES_DIR = Path(imio.map.wallonia.__file__).parent / "browser" / "static" / "bundles"


@pytest.fixture
def anon(request_factory):
    session = request_factory(api=False)
    session.headers["Accept"] = "text/html"
    return session


class TestDemoView:
    def test_renders_the_pattern(self, anon):
        response = anon.get("/@@walloniamap-demo")

        assert response.status_code == 200
        assert '<div class="pat-wallonia-map">' in response.text
        assert 'data-layer="municipalities"' in response.text
        assert '<a href="https://example.org/namur">Namur</a>' in response.text

    def test_loads_the_bundle(self, anon):
        response = anon.get("/@@walloniamap-demo")

        assert (
            "++plone++imio.map.wallonia/bundles/imio.map.wallonia-remote.min.js"
            in response.text
        )


class TestStaticResources:
    def test_remote_entry(self, anon):
        response = anon.get(
            "/++plone++imio.map.wallonia/bundles/imio.map.wallonia-remote.min.js"
        )

        assert response.status_code == 200
        assert "javascript" in response.headers["Content-Type"]

    def test_layer_data_is_json(self, anon):
        """The pattern downloads the areas of a layer: the server must give JSON."""
        layer = next(BUNDLES_DIR.glob("municipalities.*.json")).name
        response = anon.get(f"/++plone++imio.map.wallonia/bundles/{layer}")

        assert response.status_code == 200
        assert "json" in response.headers["Content-Type"]
