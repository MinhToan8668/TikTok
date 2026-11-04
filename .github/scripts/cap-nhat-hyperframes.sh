#!/usr/bin/env bash
# Đồng bộ skill HyperFrames trong .claude/skills theo bản phát hành mới nhất của heygen-com/hyperframes.
# Chạy từ gốc repo. In ra tag nếu có thay đổi; không đổi gì thì thoát 0 và không in tag.
set -euo pipefail
NGUON=https://github.com/heygen-com/hyperframes
SKILLS="hyperframes hyperframes-cli hyperframes-registry media-use reverse-any-video style-sampling"
TAG=$(git ls-remote --tags --refs "$NGUON" 'v*' | awk '{print $2}' | sed 's#refs/tags/##' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)
[ -n "$TAG" ] || { echo "Không đọc được tag phát hành" >&2; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
GIT_LFS_SKIP_SMUDGE=1 git -c advice.detachedHead=false clone -q --depth 1 --branch "$TAG" "$NGUON" "$TMP/hf"
COMMIT=$(git -C "$TMP/hf" rev-parse --short HEAD)
for s in $SKILLS; do
  [ -f "$TMP/hf/skills/$s/SKILL.md" ] || { echo "Bản $TAG không còn skill $s, dừng để người xem lại" >&2; exit 1; }
  rm -rf ".claude/skills/$s"
  cp -r "$TMP/hf/skills/$s" ".claude/skills/$s"
  cp "$TMP/hf/LICENSE" ".claude/skills/$s/LICENSE"
done
PB=${TAG#v}
sed -i -E "s#commit \`[0-9a-f]+\` \(CLI [0-9.]+\)#commit \`$COMMIT\` (CLI $PB)#; s#npx hyperframes@[0-9.]+#npx hyperframes@$PB#g" docs/hyperframes.md
echo "$TAG"
