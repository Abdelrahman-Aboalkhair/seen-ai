.PHONY: help install dev build preview lint lint-fix test clean docker-build docker-dev docker-prod docker-clean

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

preview: ## Preview production build
	npm run preview

lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix ESLint issues
	npm run lint -- --fix

test: ## Run tests
	npm run test

clean: ## Clean build artifacts
	rm -rf dist
	rm -rf node_modules
	rm -rf .vite

# Docker commands
docker-build: ## Build Docker image
	docker build -t seen-ai-hr .

docker-dev: ## Start development environment with Docker
	docker-compose up app-dev

docker-prod: ## Start production environment with Docker
	docker-compose up app-prod

docker-clean: ## Clean Docker containers and images
	docker-compose down
	docker system prune -f

docker-rebuild: ## Rebuild Docker images
	docker-compose build --no-cache

# Setup commands
setup: ## Initial project setup
	@echo "Setting up SEEN AI HR project..."
	@if [ ! -f .env.local ]; then \
		echo "Creating .env.local from .env.example..."; \
		cp .env.example .env.local; \
		echo "Please edit .env.local with your Supabase credentials"; \
	else \
		echo ".env.local already exists"; \
	fi
	npm install
	@echo "Setup complete! Run 'make dev' to start development"

setup-docker: ## Setup Docker environment
	@echo "Setting up Docker environment..."
	@if [ ! -f .env.local ]; then \
		echo "Creating .env.local from .env.example..."; \
		cp .env.example .env.local; \
		echo "Please edit .env.local with your Supabase credentials"; \
	else \
		echo ".env.local already exists"; \
	fi
	docker-compose build
	@echo "Docker setup complete! Run 'make docker-dev' to start development"

# Utility commands
logs: ## Show Docker logs
	docker-compose logs -f

status: ## Show Docker container status
	docker-compose ps

shell: ## Open shell in development container
	docker-compose exec app-dev sh

# Production deployment
deploy-build: ## Build for production deployment
	npm run build
	docker build -t seen-ai-hr:latest .

deploy-run: ## Run production container
	docker run -d -p 80:80 --name seen-ai-hr-prod seen-ai-hr:latest

deploy-stop: ## Stop production container
	docker stop seen-ai-hr-prod
	docker rm seen-ai-hr-prod

# Database commands (if using local Supabase)
db-start: ## Start local Supabase database
	docker-compose up supabase -d

db-stop: ## Stop local Supabase database
	docker-compose stop supabase

db-reset: ## Reset local database
	docker-compose down
	docker volume rm smart-recruiter-client-final_supabase_data
	docker-compose up supabase -d
