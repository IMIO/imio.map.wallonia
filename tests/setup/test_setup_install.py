from imio.map.wallonia import PACKAGE_NAME
from pathlib import Path
from plone.base.interfaces.resources import IBundleRegistry
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

import imio.map.wallonia
import pytest


BUNDLE = "++plone++imio.map.wallonia/bundles/imio.map.wallonia-remote.min.js"
BUNDLES_DIR = Path(imio.map.wallonia.__file__).parent / "browser" / "static" / "bundles"


@pytest.fixture
def bundles(integration):
    registry = getUtility(IRegistry)
    return registry.collectionOfInterface(IBundleRegistry, prefix="plone.bundles")


class TestSetupInstall:
    def test_addon_installed(self, installer):
        assert installer.is_product_installed(PACKAGE_NAME) is True

    def test_browserlayer(self, browser_layers):
        from imio.map.wallonia.interfaces import IImioMapWalloniaLayer

        assert IImioMapWalloniaLayer in browser_layers

    def test_latest_version(self, profile_last_version):
        assert profile_last_version(f"{PACKAGE_NAME}:default") == "1000"

    def test_bundle_registered(self, bundles):
        bundle = bundles["imio.map.wallonia"]
        assert bundle.enabled is True
        assert bundle.jscompilation == BUNDLE

    def test_devserver_bundle_disabled(self, bundles):
        bundle = bundles["imio.map.wallonia-devserver"]
        assert bundle.enabled is False
        assert bundle.jscompilation.startswith("http://localhost:3002/")

    def test_bundle_traversable(self, portal):
        resource = portal.restrictedTraverse(BUNDLE)
        with open(resource.path, "rb") as bundle:
            assert b"__patternslib_mf__imiomapwallonia" in bundle.read()


class TestBundleFiles:
    @pytest.mark.parametrize(
        "pattern",
        [
            "imio.map.wallonia.min.js",
            "municipalities.*.json",
            "wallonia-boundaries.*.json",
            "chunks/*.min.js",
        ],
    )
    def test_asset_shipped(self, pattern):
        assert list(BUNDLES_DIR.glob(pattern))
