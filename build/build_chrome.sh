#!/bin/bash

pushd .. > /dev/null

rm -rf dist
rm -f availablereads-chrome.zip

cp node_modules/jquery/dist/jquery.min.js src/options/lib/

mkdir dist
cp -r src dist/
cp -r icons dist/
VERSION=$(jq -r '.version' package.json)
jq '.version = $VER' --arg VER "$VERSION" build/manifest.json.chrome > tmp.$$.json && mv tmp.$$.json build/manifest.json.chrome
cp build/manifest.json.chrome dist/manifest.json

pushd dist > /dev/null
zip ../availablereads-chrome_$VERSION.zip -qr *
popd > /dev/null

popd > /dev/null
