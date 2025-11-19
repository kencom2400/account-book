#!/bin/bash
# scripts/dev/stop-docker.sh
# このスクリプトは dev-docker.sh stop のエイリアスです

# このスクリプトのディレクトリに移動
cd "$(dirname "$0")"

# dev-docker.sh stop を実行
./dev-docker.sh stop

