# Development startup script for Windows
Write-Host "🚀 Starting Oil & Gas Microservices Development Environment" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -Path "logs" -ItemType Directory -Force | Out-Null
New-Item -Path "data\mongodb" -ItemType Directory -Force | Out-Null
New-Item -Path "data\redis" -ItemType Directory -Force | Out-Null

# Build and start services
Write-Host "🔨 Building and starting microservices..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep 30

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

$services = @(
    @{name="API Gateway"; port=3000},
    @{name="Auth Service"; port=3001},
    @{name="User Service"; port=3002},
    @{name="Equipment Service"; port=3003}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.port)/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.name) is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ $($service.name) returned status $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($service.name) is not responding" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "   API Gateway:       http://localhost:3000" -ForegroundColor White
Write-Host "   Auth Service:      http://localhost:3001" -ForegroundColor White
Write-Host "   User Service:      http://localhost:3002" -ForegroundColor White
Write-Host "   Equipment Service: http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:         docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services:     docker-compose down" -ForegroundColor White
Write-Host "   Restart services:  docker-compose restart" -ForegroundColor White
Write-Host "   View status:       docker-compose ps" -ForegroundColor White
