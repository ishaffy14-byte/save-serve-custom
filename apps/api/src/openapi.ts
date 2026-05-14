export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Save&Serve API",
    version: "0.1.0",
    description: "Custom backend API scaffold for the Base44 migration."
  },
  servers: [
    {
      url: "http://localhost:4000/api/v1",
      description: "Local development"
    }
  ],
  paths: {
    "/health": {
      get: {
        summary: "API health check",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "API process is running"
          }
        }
      }
    }
  }
} as const;

