#!/bin/bash

if [[ $1 ]]; then
    VERSION=$1
    for f in firefox chrome
    do
        echo $f" "$VERSION
        jq --arg VERSION $VERSION -r '.version = $VERSION' manifest.json.$f | tee manifest.json.$f
    done
else
    for f in firefox chrome
    do
        MAJVER=$(jq -r '.version | match("\\d+\\.\\d+") | .string' manifest.json.$f)
        MINVER=$(jq -r '.version | match("\\d+$") | .string' manifest.json.$f)
        NEWMINVER=$(calc -p -d $MINVER + 1)
        NEWVER="$MAJVER.$NEWMINVER"
        echo $f" "$NEWVER
        jq --arg VERSION $NEWVER -r '.version = $VERSION' manifest.json.$f | tee manifest.json.$f
    done
fi
