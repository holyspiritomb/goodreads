#!/bin/bash

if [[ $1 ]]; then
    VERSION=$1
    for f in firefox chrome
    do
        OLDVER=$(jq -r '.version' manifest.json.$f)
        echo $f" $OLDVER => $VERSION"
        cp manifest.json.$f manifest_old.json.$f
        jq --arg VERSION "$VERSION" -r '.version = $VERSION' manifest.json.$f > manifest_new.json.$f
        mv manifest_new.json.$f manifest.json.$f
    done
else
    for f in firefox chrome
    do
        MAJVER=$(jq -r '.version | match("\\d+\\.\\d+") | .string' manifest.json.$f)
        MINVER=$(jq -r '.version | match("\\d+$") | .string' manifest.json.$f)
        NEWMINVER=$(calc -p -d "$MINVER + 1")
        OLDVER="$MAJVER.$MINVER"
        NEWVER="$MAJVER.$NEWMINVER"
        echo $f" $OLDVER => $NEWVER"
        cp manifest.json.$f manifest_old.json.$f
        jq --arg VERSION "$NEWVER" -r '.version = $VERSION' manifest.json.$f > manifest_new.json.$f
        mv manifest_new.json.$f manifest.json.$f
    done
fi
