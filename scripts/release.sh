#!/bin/bash

# Fail on any error
set -e

# Input
TAG=$1
MSG=$2

if [ -z "$TAG" ] || [ -z "$MSG" ]; then
  echo "Usage: ./release.sh v1.2.3 \"Release message\""
  exit 1
fi

# Tag, push, and release
git tag "$TAG" -m "$MSG"
git push origin "$TAG"
gh release create "$TAG" --title "Release $TAG" --notes "$MSG"

echo "✅ Release $TAG created successfully!"

