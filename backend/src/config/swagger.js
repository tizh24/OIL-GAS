import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Oil & Gas API",
            version: "1.0.0",
            description: "RESTful API for Oil & Gas management system",
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? "https://oil-gas-omega.vercel.app"
                    : "http://localhost:3000",
                description: process.env.NODE_ENV === 'production' ? "Production server" : "Development server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.js", "./routes/*.js", "../routes/*.js"],
};

export const setupSwagger = (app) => {
    try {
        console.log("Setting up Swagger documentation...");

        // Try to generate spec from route files
        let swaggerSpec;
        try {
            swaggerSpec = swaggerJsdoc(options);
            console.log("Swagger spec generated from route files");
        } catch (error) {
            console.log("Failed to generate spec from route files, using manual spec:", error.message);
            swaggerSpec = manualSpec;
        }

        // Check if the spec has any paths
        if (!swaggerSpec.paths || Object.keys(swaggerSpec.paths).length === 0) {
            console.log("No paths found in generated spec, using manual specification");
            swaggerSpec = manualSpec;
        }

        console.log("Final swagger spec paths:", Object.keys(swaggerSpec.paths || {}));

        // Serve swagger docs
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        app.get("/api-docs.json", (req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.send(swaggerSpec);
        });

        console.log("Swagger documentation available at /api-docs");
    } catch (error) {
        console.error("Error setting up Swagger:", error);

        // Fallback to manual spec in case of any error
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(manualSpec));
        app.get("/api-docs.json", (req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.send(manualSpec);
        });
    }
};