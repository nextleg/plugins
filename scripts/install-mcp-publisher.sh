#!/usr/bin/env bash
# Installs a pinned mcp-publisher into the current directory after verifying its
# Sigstore bundle, as in the registry's GitHub Actions guide:
# https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/github-actions.mdx
# Needs cosign on PATH (sigstore/cosign-installer).
set -euo pipefail
version="v1.8.14"
os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')"
archive="mcp-publisher_${os}_${arch}.tar.gz"
base_url="https://github.com/modelcontextprotocol/registry/releases/download/${version}"

curl --fail --location --silent --show-error --output "$archive" "$base_url/$archive"
curl --fail --location --silent --show-error --output "$archive.sigstore.json" "$base_url/$archive.sigstore.json"
cosign verify-blob \
  --bundle "$archive.sigstore.json" \
  --certificate-identity "https://github.com/modelcontextprotocol/registry/.github/workflows/release.yml@refs/tags/${version}" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "$archive"
tar xzf "$archive" mcp-publisher
rm -f "$archive" "$archive.sigstore.json"
