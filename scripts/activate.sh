#!/bin/bash

# Activate nodeenv
if [ -d ".nodeenv" ]; then
  source .nodeenv/bin/activate
  echo "Node.js environment activated"
  echo "Node version: $(node --version)"
  echo "pnpm version: $(pnpm --version)"
else
  echo "Error: .nodeenv directory not found"
  echo "Please run setup script first"
  exit 1
fi

