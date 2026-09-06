.PHONY: help dev start backend frontend test build install

help:
	@echo "Available commands:"
	@echo "  make dev       - Start both Backend and Frontend concurrently"
	@echo "  make backend   - Start FastAPI backend server (http://127.0.0.1:8000)"
	@echo "  make frontend  - Start React Vite frontend (http://localhost:5173)"
	@echo "  make test      - Run automated backend test suite"
	@echo "  make build     - Build frontend production bundle"

dev:
	./start.sh

start:
	./start.sh

backend:
	./run_backend.sh

frontend:
	./run_frontend.sh

test:
	./run_tests.sh

build:
	cd frontend && npm run build

