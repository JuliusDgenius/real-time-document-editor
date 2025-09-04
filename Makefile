.PHONY: help build build-dev up up-dev down logs logs-backend logs-frontend logs-db clean clean-all test test-backend test-frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  build       - Build production Docker images"
	@echo "  build-dev   - Build development Docker images"
	@echo "  up          - Start production stack"
	@echo "  up-dev      - Start development stack with hot-reload"
	@echo "  down        - Stop all containers"
	@echo "  logs        - Show logs from all services"
	@echo "  logs-backend- Show backend logs"
	@echo "  logs-frontend- Show frontend logs"
	@echo "  logs-db     - Show database logs"
	@echo "  clean       - Remove containers and networks"
	@echo "  clean-all   - Remove containers, networks, and volumes"
	@echo "  test        - Run tests for both backend and frontend"
	@echo "  test-backend- Run backend tests"
	@echo "  test-frontend- Run frontend tests"

# Build production images
build:
	docker-compose build

# Build development images
build-dev:
	docker-compose -f docker-compose.dev.yml build

# Start production stack
up:
	docker-compose up -d

# Start development stack
up-dev:
	docker-compose -f docker-compose.dev.yml up -d

# Stop all containers
down:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Show logs from all services
logs:
	docker-compose logs -f

# Show backend logs
logs-backend:
	docker-compose logs -f backend

# Show frontend logs
logs-frontend:
	docker-compose logs -f frontend

# Show database logs
logs-db:
	docker-compose logs -f postgres

# Remove containers and networks
clean:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Remove containers, networks, and volumes
clean-all:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# Run all tests
test: test-backend test-frontend

# Run backend tests
test-backend:
	cd backend && npm test

# Run frontend tests
test-frontend:
	cd frontend && npm test

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Backend not healthy"
	@curl -f http://localhost:3001 || echo "Frontend not healthy"
	@echo "Health check complete"

# Database operations
db-migrate:
	cd backend && npx prisma migrate dev

db-seed:
	cd backend && npx prisma db seed

db-reset:
	cd backend && npx prisma migrate reset --force
