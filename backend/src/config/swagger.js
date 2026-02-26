import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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
    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app) => {
    app.use("/api-docs", swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "Oil & Gas API Documentation"
    }));

    app.get("/api-docs.json", (_req, res) => {
        res.json(swaggerSpec);
    });
};
