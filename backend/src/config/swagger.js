import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Oil & Gas API",
            version: "1.0.0",
            description: "RESTful API for Oil & Gas management system"
        },
        servers: [
            {
                url: "https://oil-gas-omega.vercel.app",
                description: "Production server"
            },
            {
                url: "http://localhost:3000",
                description: "Development server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: [
        path.join(__dirname, "../routes/*.js"),
        "./src/routes/*.js"
    ]
};


const swaggerSpec = swaggerJsdoc(options);

// Fallback manual specification for Vercel deployment
const manualSpec = {
    openapi: "3.0.0",
    info: {
        title: "Oil & Gas API",
        version: "1.0.0",
        description: "RESTful API for Oil & Gas management system"
    },
    servers: [
        {
            url: "https://oil-gas-omega.vercel.app",
            description: "Production server"
        },
        {
            url: "http://localhost:3000",
            description: "Development server"
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        }
    },
    paths: {
        "/api/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register a new user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string", minLength: 6 },
                                    role: {
                                        type: "string",
                                        enum: ["admin", "engineer", "supervisor"],
                                        default: "engineer"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "User registered successfully" },
                    400: { description: "User already exists" },
                    500: { description: "Registration failed" }
                }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Login user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Login successful" },
                    401: { description: "Invalid credentials" },
                    500: { description: "Login failed" }
                }
            }
        },
        "/api/auth/refresh": {
            post: {
                tags: ["Authentication"],
                summary: "Refresh access token",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["refreshToken"],
                                properties: {
                                    refreshToken: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Token refreshed" },
                    401: { description: "Invalid refresh token" },
                    500: { description: "Token refresh failed" }
                }
            }
        },
        "/api/auth/logout": {
            post: {
                tags: ["Authentication"],
                summary: "Logout user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["refreshToken"],
                                properties: {
                                    refreshToken: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Logged out successfully" },
                    400: { description: "Refresh token required" },
                    500: { description: "Logout failed" }
                }
            }
        },
        "/api/users": {
            get: {
                tags: ["Users"],
                summary: "Get all users",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Users retrieved successfully" },
                    401: { description: "Unauthorized" },
                    500: { description: "Failed to retrieve users" }
                }
            },
            post: {
                tags: ["Users"],
                summary: "Create new user",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string", minLength: 6 },
                                    role: {
                                        type: "string",
                                        enum: ["admin", "engineer", "supervisor"],
                                        default: "engineer"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "User created successfully" },
                    400: { description: "User already exists" },
                    401: { description: "Unauthorized" },
                    500: { description: "Failed to create user" }
                }
            }
        }
    }
};

// Use manual spec as fallback for Vercel deployment
const finalSpec = (swaggerSpec && swaggerSpec.paths && Object.keys(swaggerSpec.paths).length > 0)
    ? swaggerSpec
    : manualSpec;

export const swaggerDocs = (app) => {
    console.log('Setting up Swagger docs...');
    console.log('Swagger paths found:', swaggerSpec.paths ? Object.keys(swaggerSpec.paths).length : 0);

    try {
        app.use("/api-docs", swaggerUi.serve);
        app.get("/api-docs", swaggerUi.setup(finalSpec, {
            customSiteTitle: "Oil & Gas API Documentation"
        }));

        // Also provide the raw JSON spec
        app.get("/api-docs.json", (req, res) => {
            res.json(finalSpec);
        });

        console.log('Swagger docs setup completed');
    } catch (error) {
        console.error('Swagger setup error:', error);

        // Emergency fallback
        app.get("/api-docs", (req, res) => {
            res.json({
                message: "Swagger UI failed to load",
                availableEndpoints: [
                    "GET /api/auth/register",
                    "POST /api/auth/login",
                    "POST /api/auth/refresh",
                    "POST /api/auth/logout",
                    "GET /api/users",
                    "POST /api/users"
                ]
            });
        });
    }
};
