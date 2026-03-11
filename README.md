# Oil & Gas Management System - Microservices

Hệ thống quản lý dầu khí sử dụng kiến trúc microservices với Docker containers.

## 🏗️ Kiến trúc

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
        │(Port 3001)│    │(Port 3002)│    │(Port 3003)│
        └──────────┘    └──────────┘    └───────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     MongoDB Cluster   │
                    │   (Port 27017)       │
                    └───────────────────────┘
```

## 🚀 Getting Started

### Quick Start

1. **Chạy tất cả services:**
```bash
npm run dev
```

2. **Kiểm tra services:**
```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health
```

## 📊 Development Commands

```bash
# Development (với rebuild)
npm run dev

# Stop tất cả services
npm stop

# Xem logs
npm run logs
```