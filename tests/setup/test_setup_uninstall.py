from imio.map.wallonia import PACKAGE_NAME
from plone.base.interfaces.resources import IBundleRegistry
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

import pytest


class TestSetupUninstall:
    @pytest.fixture(autouse=True)
    def uninstalled(self, installer):
        installer.uninstall_product(PACKAGE_NAME)

    def test_addon_uninstalled(self, installer):
        assert installer.is_product_installed(PACKAGE_NAME) is False

    def test_browserlayer_not_registered(self, browser_layers):
        from imio.map.wallonia.interfaces import IImioMapWalloniaLayer

        assert IImioMapWalloniaLayer not in browser_layers

    def test_bundles_removed(self):
        registry = getUtility(IRegistry)
        bundles = registry.collectionOfInterface(
            IBundleRegistry, prefix="plone.bundles"
        )
        assert "imio.map.wallonia" not in bundles
        assert "imio.map.wallonia-devserver" not in bundles
