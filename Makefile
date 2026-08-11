.PHONY: install install-backend dev-frontend dev-api dev-worker infra-up infra-down check check-frontend check-backend test-frontend test-backend

install:
	npm install
	python -m pip install -e backend[dev]

install-backend:
	python -m pip install -e backend[dev]

dev-frontend:
	node ./node_modules/next/dist/bin/next dev

dev-api:
	cd backend && python -m uvicorn app.main:app --reload --port 8000

dev-worker:
	cd backend && python -m celery -A app.worker.celery_app worker --loglevel=info

infra-up:
	docker compose up --build

infra-down:
	docker compose down

check: check-frontend check-backend

check-frontend:
	node ./node_modules/eslint/bin/eslint.js .
	node ./node_modules/typescript/bin/tsc --noEmit
	node ./node_modules/vitest/vitest.mjs run
	node ./node_modules/next/dist/bin/next build

check-backend:
	.venv/Scripts/python -m ruff check backend
	.venv/Scripts/python -m mypy backend/app backend/tests
	.venv/Scripts/python -m pytest backend

test-frontend:
	node ./node_modules/vitest/vitest.mjs run

test-backend:
	.venv/Scripts/python -m pytest backend
