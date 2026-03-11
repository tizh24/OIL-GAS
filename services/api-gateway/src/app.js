import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import "dotenv/config";

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Service URLs
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    equipment: process.env.EQUIPMENT_SERVICE_URL || 'http://localhost:3003'
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API Gateway is running',
        services,
        timestamp: new Date().toISOString()
    });
});

// Proxy middleware configuration
const proxyOptions = {
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(502).json({
            success: false,
            message: 'Service temporarily unavailable',
            error: process.env.NODE_ENV !== 'production' ? err.message : undefined
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log requests in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${proxyReq.path}`);
        }
    }
};

// Route to Auth Service
app.use('/api/auth', createProxyMiddleware({
    target: services.auth,
    ...proxyOptions
}));

// Route to User Service
app.use('/api/users', createProxyMiddleware({
    target: services.user,
    ...proxyOptions
}));

// Route to Equipment Service
app.use('/api/equipment', createProxyMiddleware({
    target: services.equipment,
    ...proxyOptions
}));

app.use('/api/instruments', createProxyMiddleware({
    target: services.equipment,
    ...proxyOptions
}));

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Oil & Gas Management API Gateway',
        version: '1.0.0',
        services: Object.keys(services),
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal gateway error',
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
});

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`API Gateway running on port ${PORT}`);
        console.log('Available services:', services);
    });
};

if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export default app;
