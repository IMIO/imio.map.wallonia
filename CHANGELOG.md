# Changelog

<!--
   You should *NOT* be adding new change log entries to this file.
   You should create a file in the news directory instead.
   For helpful instructions, please see:
   https://github.com/plone/plone.releaser/blob/master/ADD-A-NEWS-ITEM.rst
-->

<!-- towncrier release notes start -->

## 1.0.0a2 (2026-11-20)


### Bug fixes:

- Share `react-dom/client` and `react/jsx-runtime` with the other iMio add-ons, next to `react` and `react-dom`, so that the page uses one React. Without them, an add-on with another React patch version stops with React error #527. @duchenean 

## 1.0.0a1 (2026-11-20)


### New features:

- Add the `pat-wallonia-map` pattern: a Leaflet map of Wallonia that shows the links of the page as clickable areas, shipped as a Module Federation bundle. The first layer is `municipalities`. @duchenean
