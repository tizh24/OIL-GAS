import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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
        path.join(__dirname, "../routes/engineer/*.js")
    ]
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app) => {

    // Setup swagger middleware for both /api-docs and /api-docs/
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }'
    }));
    app.get('/api-docs/', swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }'
    }));

};