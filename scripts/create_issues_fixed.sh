#!/bin/bash

ISSUE_FILE="StackMotive_Issues_Markdown_1-149.md"

if [ ! -f "$ISSUE_FILE" ]; then
  echo "❌ Markdown file not found: $ISSUE_FILE"
  exit 1
fi

current_title=""
current_body=""
inside_block=0

while IFS= read -r line || [ -n "$line" ]; do
  if [[ "$line" =~ ^##\  ]]; then
    # If we’ve already captured a full block, push it
    if [[ $inside_block -eq 1 && -n "$current_title" && -n "$current_body" ]]; then
      clean_title=$(echo "$current_title" | sed 's/^## *//')
      echo "🚀 Creating: $clean_title"
      gh issue create --title "$clean_title" --body "$current_body"
      sleep 1
    fi
    current_title="$line"
    current_body=""
    inside_block=1
  else
    current_body+="$line"$'\n'
  fi
done < "$ISSUE_FILE"

# Push final block
if [[ -n "$current_title" && -n "$current_body" ]]; then
  clean_title=$(echo "$current_title" | sed 's/^## *//')
  echo "🚀 Creating: $clean_title"
  gh issue create --title "$clean_title" --body "$current_body"
fi

echo "✅ All issues pushed cleanly."
