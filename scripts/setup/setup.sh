#!/bin/bash

echo "Setting up development environment..."

# Install dependencies
pnpm install

# Build shared libraries
pnpm --filter @account-book/types build
pnpm --filter @account-book/utils build

# Create data directories (if not exist)
mkdir -p data/{transactions,institutions,categories,settings}

echo "Setup complete!"
echo ""
echo "To start development servers, run:"
echo "  pnpm dev"

