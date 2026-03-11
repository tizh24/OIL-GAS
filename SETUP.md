# Oil & Gas Microservices Setup Guide

## 🚀 Hướng dẫn Setup và Chạy Hệ thống

### Bước 1: Cài đặt Docker Desktop

1. **Tải Docker Desktop cho Windows:**
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Tải về và cài đặt Docker Desktop
   - Khởi động Docker Desktop và đăng nhập (hoặc tạo tài khoản)

2. **Kiểm tra cài đặt:**
   ```bash
   docker --version
   docker-compose --version
   ```

### Bước 2: Setup Environment

1. **Kiểm tra file .env:**
   ```bash
   # File .env đã được tạo với cấu hình cần thiết
   # Có thể điều chỉnh ports hoặc database settings nếu cần
   ```

2. **Tạo thư mục cần thiết:**
   ```bash
   mkdir -p logs data/mongodb data/redis
   ```

### Bước 3: Khởi chạy Microservices

**Option 1: Sử dụng script tự động (Recommended)**
```bash
# Windows PowerShell
.\scripts\dev-start.ps1

# Linux/Mac
chmod +x scripts/dev-start.sh
./scripts/dev-start.sh
```

**Option 2: Chạy thủ công**
```bash
# Build và start tất cả services
docker-compose up --build -d

# Xem logs
docker-compose logs -f

# Kiểm tra status
docker-compose ps
```

### Bước 4: Kiểm tra Services

**Health Checks:**
```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service  
curl http://localhost:3001/health

# User Service
curl http://localhost:3002/health

# Equipment Service
curl http://localhost:3003/health
```

**Hoặc mở trình duyệt:**
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001/health
- User Service: http://localhost:3002/health
- Equipment Service: http://localhost:3003/health

### Bước 5: Test API Endpoints

**1. Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@oilgas.com",
    "password": "AdminPass123!",
    "role": "admin",
    "department": "IT"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@oilgas.com",
    "password": "AdminPass123!"
  }'
```

**3. Get Users (cần token):**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**4. Create Equipment:**
```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Main Drilling Rig",
    "type": "drilling",
    "serial": "DR001",
    "model": "DR-X1000",
    "manufacturer": "OilTech Inc",
    "location": "Platform A"
  }'
```

## 🛠️ Development Commands

```bash
# Start development environment
npm run dev

# Stop all services
npm run stop

# View logs
npm run logs

# Specific service logs
npm run logs:auth
npm run logs:user
npm run logs:equipment
npm run logs:gateway

# Rebuild all images
npm run rebuild

# Clean everything
npm run clean

# Check service status
npm run services:status
```

## 🗄️ Database Access

**MongoDB:**
```bash
# Connect to MongoDB container
docker exec -it oil-gas-mongodb mongosh

# Or using URI
mongosh "mongodb://admin:password123@localhost:27017/Oil_Gas_Auth?authSource=admin"
```

**Redis:**
```bash
# Connect to Redis container
docker exec -it oil-gas-redis redis-cli
# Password: redis123
```

## 🐛 Troubleshooting

### Port Conflicts
```bash
# Kiểm tra ports đang sử dụng
netstat -an | findstr "3000"
netstat -an | findstr "3001"
netstat -an | findstr "3002"
netstat -an | findstr "3003"
```

### Container Issues
```bash
# Restart specific service
docker-compose restart auth-service

# View container logs
docker logs oil-gas-auth-service

# Remove and recreate
docker-compose down
docker-compose up --build -d
```

### Database Issues
```bash
# Reset databases
docker-compose down -v
docker-compose up --build -d
```

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │
│   (React/Vue)   │◄───┤   (Port 3000)   │
└─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──┐    ┌───────▼──┐    ┌─────▼─────┐
        │Auth      │    │User      │    │Equipment  │
        │Service   │    │Service   │    │Service    │
        │(3001)    │    │(3002)    │    │(3003)     │
        └──────────┘    └──────────┘    └───────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   MongoDB + Redis     │
                    │   (27017 + 6379)     │
                    └───────────────────────┘
```

## 🔗 Useful Links

- **API Documentation**: http://localhost:3000/api-docs (coming soon)
- **MongoDB Express**: http://localhost:8081 (if enabled)
- **Redis Commander**: http://localhost:8082 (if enabled)

## 🚀 Next Steps

1. ✅ Setup microservices architecture
2. ✅ Docker containerization  
3. ✅ API Gateway implementation
4. 🔄 Add API documentation (Swagger)
5. 🔄 Add monitoring and logging
6. 🔄 Add frontend integration
7. 🔄 Add tests
8. 🔄 Production deployment
