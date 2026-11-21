#!/usr/bin/env bash
# Downloads the DINOv2-small image model (about 88 MB) the backend uses to recognise dogs from photos.
set -euo pipefail
DEST="$(cd "$(dirname "$0")/.." && pwd)/backend/models"
mkdir -p "$DEST"
if [[ -s "$DEST/dinov2-small.onnx" ]]; then echo "Model already present."; exit 0; fi
curl -L --fail -o "$DEST/dinov2-small.onnx" \
  https://huggingface.co/Xenova/dinov2-small/resolve/main/onnx/model.onnx
echo "Saved $DEST/dinov2-small.onnx"
