#!/bin/bash

# Path to your Markdown file
ISSUE_FILE="StackMotive_Issues_Markdown_1-149.md"

# Variables
current_title=""
current_body=""

# Read the Markdown file line by line
while IFS= read -r line; do
  if [[ $line == "## "* ]]; then
    if [[ -n "$current_title" && -n "$current_body" ]]; then
      gh issue create --title "$current_title" --body "$current_body"
      sleep 1
    fi
    current_title="${line/## /}"
    current_body=""
  elif [[ $line == "**Description**:"* ]]; then
    current_body="${line/**Description**: /}"
  fi
done < "$ISSUE_FILE"

if [[ -n "$current_title" && -n "$current_body" ]]; then
  gh issue create --title "$current_title" --body "$current_body"
fi

echo "✅ All issues created from $ISSUE_FILE"
