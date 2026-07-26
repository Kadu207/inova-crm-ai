#!/usr/bin/env bash
# create-swap-inova.sh — create 4G swapfile for shared Hetzner VPS.
# MUST run as root (or: sudo bash infrastructure/scripts/create-swap-inova.sh)
set -euo pipefail

SWAP_FILE="${VPS_SWAP_FILE:-/swapfile-inova}"
SWAP_SIZE_GB="${VPS_SWAP_SIZE_GB:-4}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

if swapon --show 2>/dev/null | grep -q .; then
  echo "Swap already active:"
  swapon --show
  exit 0
fi

if [[ -f "$SWAP_FILE" ]]; then
  echo "Enabling existing ${SWAP_FILE}"
  chmod 600 "$SWAP_FILE"
  swapon "$SWAP_FILE"
  swapon --show
  exit 0
fi

echo "Creating ${SWAP_SIZE_GB}G at ${SWAP_FILE}"
if command -v fallocate >/dev/null 2>&1; then
  fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE"
else
  dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$((SWAP_SIZE_GB * 1024)) status=progress
fi
chmod 600 "$SWAP_FILE"
mkswap "$SWAP_FILE"
swapon "$SWAP_FILE"

if ! grep -qF "$SWAP_FILE" /etc/fstab; then
  echo "${SWAP_FILE} none swap sw 0 0" >>/etc/fstab
fi

swapon --show
free -h
echo "SWAP_OK ${SWAP_FILE}"
