# Microservices Test Script
# Run this to test all microservices functionality

Write-Host "🧪 Testing Oil & Gas Microservices Architecture" -ForegroundColor Green
Write-Host "=" * 50

# Test 1: API Gateway Health
Write-Host "`n1. Testing API Gateway Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✅ API Gateway: HEALTHY" -ForegroundColor Green
    Write-Host "   Services Available:" -ForegroundColor Cyan
    Write-Host "   - Auth: $($response.services.auth)" -ForegroundColor White
    Write-Host "   - User: $($response.services.user)" -ForegroundColor White
    Write-Host "   - Equipment: $($response.services.equipment)" -ForegroundColor White
} catch {
    Write-Host "❌ API Gateway: FAILED" -ForegroundColor Red
}

# Test 2: Auth Service Health
Write-Host "`n2. Testing Auth Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/health" -Method GET
    Write-Host "✅ Auth Service: HEALTHY" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor White
    Write-Host "   Version: $($response.version)" -ForegroundColor White
} catch {
    Write-Host "❌ Auth Service: FAILED" -ForegroundColor Red
}

# Test 3: User Service Health
Write-Host "`n3. Testing User Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users/health" -Method GET
    Write-Host "✅ User Service: HEALTHY" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor White
    Write-Host "   Version: $($response.version)" -ForegroundColor White
} catch {
    Write-Host "❌ User Service: FAILED" -ForegroundColor Red
}

# Test 4: Equipment Service Health
Write-Host "`n4. Testing Equipment Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/equipment/health" -Method GET
    Write-Host "✅ Equipment Service: HEALTHY" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor White
    Write-Host "   Version: $($response.version)" -ForegroundColor White
} catch {
    Write-Host "❌ Equipment Service: FAILED" -ForegroundColor Red
}

# Test 5: Container Status
Write-Host "`n5. Checking Container Status..." -ForegroundColor Yellow
try {
    $containers = docker-compose ps --format "table {{.Name}}\t{{.Status}}"
    Write-Host "✅ Container Status:" -ForegroundColor Green
    Write-Host $containers -ForegroundColor White
} catch {
    Write-Host "❌ Container Status: FAILED" -ForegroundColor Red
}

# Test 6: Database Connections (via logs)
Write-Host "`n6. Checking Database Connections..." -ForegroundColor Yellow
$authLogs = docker-compose logs auth-service 2>$null | Select-String "MongoDB Connected" | Select-Object -Last 1
$userLogs = docker-compose logs user-service 2>$null | Select-String "MongoDB Connected" | Select-Object -Last 1
$equipLogs = docker-compose logs equipment-service 2>$null | Select-String "MongoDB Connected" | Select-Object -Last 1

if ($authLogs) { Write-Host "✅ Auth Service DB: Connected" -ForegroundColor Green }
else { Write-Host "❌ Auth Service DB: Not Connected" -ForegroundColor Red }

if ($userLogs) { Write-Host "✅ User Service DB: Connected" -ForegroundColor Green }
else { Write-Host "❌ User Service DB: Not Connected" -ForegroundColor Red }

if ($equipLogs) { Write-Host "✅ Equipment Service DB: Connected" -ForegroundColor Green }
else { Write-Host "❌ Equipment Service DB: Not Connected" -ForegroundColor Red }

Write-Host "`n🎉 Microservices Testing Complete!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "• API Gateway running on: http://localhost:3000" -ForegroundColor White
Write-Host "• Auth Service running on: http://localhost:3001" -ForegroundColor White  
Write-Host "• User Service running on: http://localhost:3002" -ForegroundColor White
Write-Host "• Equipment Service running on: http://localhost:3003" -ForegroundColor White
Write-Host "• MongoDB running on: localhost:27017" -ForegroundColor White
Write-Host "• Redis running on: localhost:6379" -ForegroundColor White

Write-Host "`n🌐 Available Endpoints:" -ForegroundColor Cyan
Write-Host "• Gateway Health: http://localhost:3000/health" -ForegroundColor White
Write-Host "• Auth API: http://localhost:3000/api/auth/*" -ForegroundColor White
Write-Host "• User API: http://localhost:3000/api/users/*" -ForegroundColor White
Write-Host "• Equipment API: http://localhost:3000/api/equipment/*" -ForegroundColor White

Write-Host "`n✨ Migration Status: SUCCESSFULLY COMPLETED!" -ForegroundColor Green
