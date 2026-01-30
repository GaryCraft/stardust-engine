#!/bin/bash
set -e

# Configuration
REGISTRY="ghcr.io"
NAMESPACE="garycraft" # Adjust if your github username/org is different
IMAGE_NAME="stardust-engine"
FULL_IMAGE_NAME="$REGISTRY/$NAMESPACE/$IMAGE_NAME"
TAG=${1:-dev}
FLAVOR=${2:-standard}

if [ "$FLAVOR" == "pterodactyl" ]; then
    IMAGE_NAME="stardust-engine"
    FULL_IMAGE_NAME="$REGISTRY/$NAMESPACE/$IMAGE_NAME"
    DOCKERFILE="Dockerfile.pterodactyl"
    TAG="${TAG}-pterodactyl"
else
    FULL_IMAGE_NAME="$REGISTRY/$NAMESPACE/$IMAGE_NAME"
    DOCKERFILE="dockerfile"
fi

echo "=================================================="
echo "Build & Push: $FULL_IMAGE_NAME:$TAG"
echo "Dockerfile:   $DOCKERFILE"
echo "Platforms:    linux/amd64,linux/arm64"
echo "=================================================="

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: docker command not found."
    exit 1
fi

# Check logic for buildx
if ! docker buildx version &> /dev/null; then
    echo "Error: docker buildx is not available. Please install it."
    exit 1
fi

# Create builder if not exists
if ! docker buildx inspect stardust-builder > /dev/null 2>&1; then
    echo "Creating new buildx builder 'stardust-builder'..."
    # 'docker-container' driver is required for multi-arch builds often
    docker buildx create --use --name stardust-builder --driver docker-container
    docker buildx inspect --bootstrap
else
    echo "Using existing buildx builder 'stardust-builder'..."
    docker buildx use stardust-builder
fi

echo "Starting build..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$FULL_IMAGE_NAME:$TAG" \
  -f "$DOCKERFILE" \
  --push \
  .

echo "=================================================="
echo "Successfully built and pushed!"
echo "Image: $FULL_IMAGE_NAME:$TAG"
echo "=================================================="
