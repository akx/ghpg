#!/bin/bash
set -euo pipefail
git_root=$(git rev-parse --show-toplevel)
temp=$(mktemp -d)
cd $temp
git init
git config user.name "you"
git config user.email "you@example.com"
mkdir -p dist/sub
date > dist/a.txt
date > dist/sub/b.txt
dd if=/dev/urandom of=dist/big.dat bs=512k count=8
git add .
git commit -m yes
$git_root/bin/ghpg -j -d dist
