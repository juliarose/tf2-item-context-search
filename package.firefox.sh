#!/bin/sh

# web-ext is required to run this tool
# npm install --global web-ext

rm -rf ./dist/trade.links
rm -rf ./dist/trade.links.firefox
mkdir -p dist
mkdir ./dist/trade.links

cp -a ./js ./dist/trade.links/js
cp -a ./images ./dist/trade.links/images
cp -a ./css ./dist/trade.links/css
cp -a ./views ./dist/trade.links/views
cp -a ./manifest.firefox.json ./dist/trade.links/manifest.json
cp -a ./README.md ./dist/trade.links/README.md
cp -a ./LICENSE ./dist/trade.links/LICENSE

mv ./dist/trade.links/ ./dist/trade.links.firefox
cd ./dist/trade.links.firefox

zip -r trade.links.firefox.zip ./*

cd -

mv ./dist/trade.links.firefox/trade.links.firefox.zip ./dist/trade.links.firefox.zip

# to run this using web-ext:
# cd ./dist/trade.links.firefox
# web-ext run --verbose