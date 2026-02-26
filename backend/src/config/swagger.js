import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// // Manual specification for Vercel deployment
// const manualSpec = {
//     openapi: "3.0.0",
//     info: {
//         title: "Oil & Gas API",
//         version: "1.0.0",
//         description: "RESTful API for Oil & Gas management system"
//     },
//     servers: [
//         {
//             url: "https://oil-gas-omega.vercel.app",
//             description: "Production server"
//         },
//         {
//             url: "http://localhost:3000",
//             description: "Development server"
//         }
//     ],
//     components: {
//         securitySchemes: {
//             bearerAuth: {
//                 type: "http",
//                 scheme: "bearer",
//                 bearerFormat: "JWT"
//             }
//         }
//     },
//     paths: {
//         "/api/auth/login": {
//             post: {
//                 tags: ["Authentication"],
//                 summary: "User login",
//                 description: "Authenticate user and get access tokens",
//                 requestBody: {
//                     required: true,
//                     content: {
//                         "application/json": {
//                             schema: {
//                                 type: "object",
//                                 required: ["email", "password"],
//                                 properties: {
//                                     email: {
//                                         type: "string",
//                                         format: "email",
//                                         example: "user@example.com"
//                                     },
//                                     password: {
//                                         type: "string",
//                                         example: "password123"
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 responses: {
//                     200: { description: "Login successful" },
//                     400: { description: "Email and password are required" },
//                     401: { description: "Invalid credentials" },
//                     500: { description: "Login failed" }
//                 }
//             }
//         },
//         "/api/auth/logout": {
//             post: {
//                 tags: ["Authentication"],
//                 summary: "User logout",
//                 description: "Invalidate refresh token and logout user",
//                 requestBody: {
//                     required: true,
//                     content: {
//                         "application/json": {
//                             schema: {
//                                 type: "object",
//                                 required: ["refreshToken"],
//                                 properties: {
//                                     refreshToken: {
//                                         type: "string",
//                                         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 responses: {
//                     200: { description: "Logged out successfully" },
//                     400: { description: "Refresh token is required" },
//                     404: { description: "Refresh token not found" },
//                     500: { description: "Logout failed" }
//                 }
//             }
//         },
//         "/api/users": {
//             get: {
//                 tags: ["Users"],
//                 summary: "Get all users",
//                 description: "Retrieve a list of all users (requires authentication)",
//                 security: [{ bearerAuth: [] }],
//                 responses: {
//                     200: { description: "Users retrieved successfully" },
//                     401: { description: "Unauthorized - Invalid or missing token" },
//                     500: { description: "Failed to retrieve users" }
//                 }
//             },
//             post: {
//                 tags: ["Admin"],
//                 summary: "Create new user",
//                 description: "Create a new user account (admin only)",
//                 security: [{ bearerAuth: [] }],
//                 requestBody: {
//                     required: true,
//                     content: {
//                         "application/json": {
//                             schema: {
//                                 type: "object",
//                                 required: ["email", "password"],
//                                 properties: {
//                                     email: {
//                                         type: "string",
//                                         format: "email",
//                                         example: "newuser@example.com"
//                                     },
//                                     password: {
//                                         type: "string",
//                                         minLength: 6,
//                                         example: "securepassword123"
//                                     },
//                                     role: {
//                                         type: "string",
//                                         enum: ["admin", "engineer", "supervisor"],
//                                         default: "engineer",
//                                         example: "engineer"
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 responses: {
//                     200: { description: "User created successfully" },
//                     400: { description: "User already exists or invalid input" },
//                     401: { description: "Unauthorized - Invalid or missing token" },
//                     403: { description: "Forbidden - Admin access required" },
//                     500: { description: "Failed to create user" }
//                 }
//             }
//         }
//     }
// };

// const options = {
//     definition: {
//         openapi: "3.0.0",
//         info: {
//             title: "Oil & Gas API",
//             version: "1.0.0"
//         },
//         components: {
//             securitySchemes: {
//                 bearerAuth: {
//                     type: "http",
//                     scheme: "bearer",
//                     bearerFormat: "JWT"
//                 }
//             }
//         }
//     },
//     apis: ["./routes/*.js"]
// };

// export const swaggerDocs = (app) => {
//     let swaggerSpec;

//     try {
//         // Try to generate from route files
//         swaggerSpec = swaggerJsdoc(options);

//         // If no paths found, use manual spec
//         if (!swaggerSpec.paths || Object.keys(swaggerSpec.paths).length === 0) {
//             console.log("Using manual specification for Swagger");
//             swaggerSpec = manualSpec;
//         }
//     } catch (error) {
//         console.log("Using manual specification due to error:", error.message);
//         swaggerSpec = manualSpec;
//     }

//     app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
//         customSiteTitle: "Oil & Gas API Documentation"
//     }));
// };

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
                url: "http://localhost:3000",
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
    apis: ["../routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};