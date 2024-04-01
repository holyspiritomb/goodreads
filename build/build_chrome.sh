#!/bin/bash

pushd .. > /dev/null

rm -rf dist
rm -f availablereads-chrome.zip

cp node_modules/jquery/dist/jquery.min.js src/options/

mkdir dist
cp -r src dist/
cp -r icons dist/
VERSION=$(jq -r '.version' build/manifest.json.chrome)
cp build/manifest.json.chrome dist/manifest.json

pushd dist > /dev/null
zip ../availablereads-chrome_$VERSION.zip -qr *
popd > /dev/null

popd > /dev/null
