#!/bin/bash

pushd .. > /dev/null

rm -rf dist
rm -f availablereads-firefox.zip

cp node_modules/jquery/dist/jquery.min.js src/options/

mkdir dist
cp -r src dist/
cp -r icons dist/
VERSION=$(jq -r '.version' package.json)
jq '.version = $VER' --arg VER "$VERSION" build/manifest.json.firefox > tmp.$$.json && mv tmp.$$.json build/manifest.json.firefox
cp build/manifest.json.firefox dist/manifest.json

pushd dist > /dev/null
zip ../availablereads-firefox_$VERSION.zip -qr *
popd > /dev/null

popd > /dev/null
