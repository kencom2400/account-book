#!/bin/bash

# パフォーマンステスト実行スクリプト
# Usage: ./scripts/test/test-perf.sh [target]
# target: backend, frontend, all (default: all)

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログファイル
LOG_DIR="logs"
BACKEND_PERF_LOG="${LOG_DIR}/backend-perf-test.log"
FRONTEND_PERF_LOG="${LOG_DIR}/frontend-perf-test.log"

# ログディレクトリ作成
mkdir -p "${LOG_DIR}"

# ヘルプ表示
show_help() {
  echo "Usage: $0 [target]"
  echo ""
  echo "Targets:"
  echo "  backend   - Run backend performance tests only"
  echo "  frontend  - Run frontend performance tests only"
  echo "  all       - Run all performance tests (default)"
  echo ""
  echo "Examples:"
  echo "  $0              # Run all performance tests"
  echo "  $0 backend      # Run backend performance tests only"
  echo "  $0 frontend     # Run frontend performance tests only"
}

# Backend パフォーマンステスト
run_backend_perf_tests() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Backend Performance Tests${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""

  cd apps/backend

  echo -e "${YELLOW}Starting database for performance tests...${NC}"
  # データベースが起動していることを確認
  if ! nc -z localhost 3306 2>/dev/null; then
    echo -e "${YELLOW}Database not running. Starting database...${NC}"
    ../../scripts/dev/start-database.sh
    sleep 5
  fi

  echo -e "${YELLOW}Running backend performance tests...${NC}"
  pnpm test:perf 2>&1 | tee "../../${BACKEND_PERF_LOG}"
  
  BACKEND_EXIT_CODE=${PIPESTATUS[0]}

  cd ../..

  if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Backend performance tests passed${NC}"
    echo ""
    return 0
  else
    echo -e "${RED}✗ Backend performance tests failed${NC}"
    echo -e "${RED}Check log: ${BACKEND_PERF_LOG}${NC}"
    echo ""
    return 1
  fi
}

# Frontend パフォーマンステスト
run_frontend_perf_tests() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Frontend Performance Tests${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""

  cd apps/frontend

  # Backend と Database が起動していることを確認
  echo -e "${YELLOW}Checking if backend and database are running...${NC}"
  
  if ! nc -z localhost 3306 2>/dev/null; then
    echo -e "${YELLOW}Database not running. Starting database...${NC}"
    ../../scripts/dev/start-database.sh
    sleep 5
  fi

  if ! nc -z localhost 3001 2>/dev/null; then
    echo -e "${YELLOW}Backend not running. Please start backend manually:${NC}"
    echo -e "${YELLOW}  cd apps/backend && pnpm dev${NC}"
    echo ""
    echo -e "${RED}Skipping frontend performance tests${NC}"
    cd ../..
    return 1
  fi

  # Frontend サーバーを起動していない場合は起動
  if ! nc -z localhost 3000 2>/dev/null; then
    echo -e "${YELLOW}Frontend not running. Starting frontend server...${NC}"
    PORT=3000 pnpm dev > "../../${FRONTEND_PERF_LOG}" 2>&1 &
    FRONTEND_PID=$!
    
    echo -e "${YELLOW}Waiting for frontend server to be ready...${NC}"
    max_wait=30
    waited=0
    while ! nc -z localhost 3000 2>/dev/null && [ $waited -lt $max_wait ]; do
      sleep 1
      waited=$((waited + 1))
      echo -n "."
    done
    echo ""
    
    if [ $waited -ge $max_wait ]; then
      echo -e "${RED}Frontend server failed to start${NC}"
      kill $FRONTEND_PID 2>/dev/null || true
      cd ../..
      return 1
    fi
    
    STOP_FRONTEND=true
  else
    STOP_FRONTEND=false
  fi

  echo -e "${YELLOW}Running frontend performance tests...${NC}"
  pnpm exec playwright test performance.spec.ts 2>&1 | tee -a "../../${FRONTEND_PERF_LOG}"
  
  FRONTEND_EXIT_CODE=${PIPESTATUS[0]}

  # Frontend サーバーを停止
  if [ "$STOP_FRONTEND" = true ] && [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}Stopping frontend server...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
  fi

  cd ../..

  if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend performance tests passed${NC}"
    echo ""
    return 0
  else
    echo -e "${RED}✗ Frontend performance tests failed${NC}"
    echo -e "${RED}Check log: ${FRONTEND_PERF_LOG}${NC}"
    echo ""
    return 1
  fi
}

# メイン処理
main() {
  TARGET="${1:-all}"

  case "$TARGET" in
    -h|--help)
      show_help
      exit 0
      ;;
    backend)
      echo -e "${GREEN}Running backend performance tests...${NC}"
      echo ""
      run_backend_perf_tests
      exit $?
      ;;
    frontend)
      echo -e "${GREEN}Running frontend performance tests...${NC}"
      echo ""
      run_frontend_perf_tests
      exit $?
      ;;
    all)
      echo -e "${GREEN}Running all performance tests...${NC}"
      echo ""
      
      BACKEND_SUCCESS=0
      FRONTEND_SUCCESS=0

      # Backend パフォーマンステスト実行
      if run_backend_perf_tests; then
        BACKEND_SUCCESS=1
      fi

      # Frontend パフォーマンステスト実行
      if run_frontend_perf_tests; then
        FRONTEND_SUCCESS=1
      fi

      # 結果サマリー
      echo ""
      echo -e "${BLUE}========================================${NC}"
      echo -e "${BLUE}Performance Test Summary${NC}"
      echo -e "${BLUE}========================================${NC}"
      
      if [ $BACKEND_SUCCESS -eq 1 ]; then
        echo -e "${GREEN}✓ Backend Performance Tests: PASSED${NC}"
      else
        echo -e "${RED}✗ Backend Performance Tests: FAILED${NC}"
      fi

      if [ $FRONTEND_SUCCESS -eq 1 ]; then
        echo -e "${GREEN}✓ Frontend Performance Tests: PASSED${NC}"
      else
        echo -e "${RED}✗ Frontend Performance Tests: FAILED${NC}"
      fi

      echo ""
      echo -e "${BLUE}Logs:${NC}"
      echo -e "  Backend:  ${BACKEND_PERF_LOG}"
      echo -e "  Frontend: ${FRONTEND_PERF_LOG}"

      if [ $BACKEND_SUCCESS -eq 1 ] && [ $FRONTEND_SUCCESS -eq 1 ]; then
        echo ""
        echo -e "${GREEN}✓ All performance tests passed!${NC}"
        exit 0
      else
        echo ""
        echo -e "${RED}✗ Some performance tests failed${NC}"
        exit 1
      fi
      ;;
    *)
      echo -e "${RED}Error: Unknown target '${TARGET}'${NC}"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

main "$@"

