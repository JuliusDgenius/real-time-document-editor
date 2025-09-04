# 🐳 Docker Setup Guide

This guide covers the Docker containerization setup for the Real-Time Collaborative Document Editor.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose available
- At least 4GB of available RAM
- Ports 3000, 3001, and 5432 available

## 🚀 Quick Start

### Option 1: Use the Quick Start Script
```bash
./quick-start.sh
```

### Option 2: Manual Setup
```bash
# Build development images
make build-dev

# Start development stack
make up-dev

# Check status
make health
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Database      │
│   Port: 3001    │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Optional)    │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 📁 File Structure

```
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Development stack
├── Makefile                    # Common commands
├── quick-start.sh             # Quick setup script
├── backend/
│   ├── Dockerfile             # Production backend image
│   ├── Dockerfile.dev         # Development backend image
│   └── .dockerignore          # Backend exclusions
└── frontend/
    ├── Dockerfile             # Production frontend image
    ├── Dockerfile.dev         # Development frontend image
    ├── nginx.conf             # Nginx configuration
    └── .dockerignore          # Frontend exclusions
```

## 🔧 Available Commands

### Using Make
```bash
make help              # Show all commands
make build             # Build production images
make build-dev         # Build development images
make up                # Start production stack
make up-dev            # Start development stack
make down              # Stop all services
make logs              # Show all logs
make logs-backend      # Show backend logs
make logs-frontend     # Show frontend logs
make logs-db           # Show database logs
make health            # Check service health
make clean             # Remove containers
make clean-all         # Remove containers and volumes
```

### Using Docker Compose Directly
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose up -d
docker-compose down
```

## 🌍 Environment Variables

### Backend
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origins

### Frontend
- `VITE_API_URL`: Backend API URL

### Database
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

## 🔄 Development vs Production

### Development Mode
- **Hot-reload enabled** for both frontend and backend
- **Volume mounts** for live code changes
- **Development dependencies** included
- **Debug logging** enabled
- **Port 3001** for frontend (Vite dev server)

### Production Mode
- **Optimized builds** with production dependencies only
- **Nginx** serves frontend static files
- **Health checks** enabled
- **Security headers** configured
- **Gzip compression** enabled

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill the process or change ports in docker-compose files
```

#### Database Connection Issues
```bash
# Check database logs
make logs-db

# Restart database
docker-compose restart postgres
```

#### Build Failures
```bash
# Clean and rebuild
make clean-all
make build-dev
```

#### Memory Issues
```bash
# Check Docker resource usage
docker stats

# Increase Docker Desktop memory limit
# (Docker Desktop → Settings → Resources → Memory)
```

### Reset Everything
```bash
# Stop and remove everything
make clean-all

# Remove all images
docker system prune -a

# Start fresh
make build-dev
make up-dev
```

## 📊 Monitoring

### Health Checks
```bash
# Check all services
make health

# Individual service checks
curl http://localhost:3000/api/health
curl http://localhost:3001
```

### Logs
```bash
# All services
make logs

# Specific service
make logs-backend
make logs-frontend
make logs-db
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🔒 Security Considerations

- **Non-root users** in containers
- **Secrets** not committed to version control
- **Security headers** in nginx configuration
- **CORS** properly configured
- **JWT secrets** should be strong and unique

## 📈 Scaling

### Horizontal Scaling
- **Redis adapter** for Socket.IO scaling
- **Load balancer** ready configuration
- **Stateless** backend design

### Vertical Scaling
- **Resource limits** configurable in docker-compose
- **Memory and CPU** constraints available

## 🎯 Next Steps

After completing Phase 1:

1. **Test the setup** with `make health`
2. **Verify real-time collaboration** works
3. **Move to Phase 2** for collaboration enhancements
4. **Prepare for cloud deployment** in Phase 3

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
