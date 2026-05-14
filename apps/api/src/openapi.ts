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
    },
    "/shops": {
      get: {
        summary: "List active shops",
        operationId: "listShops",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 }
          },
          {
            name: "offset",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 0, default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "Active shops"
          }
        }
      }
    },
    "/listings": {
      get: {
        summary: "List active listings",
        operationId: "listListings",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 }
          },
          {
            name: "offset",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 0, default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "Active listings"
          }
        }
      }
    },
    "/listings/nearby": {
      get: {
        summary: "List nearby active listings",
        operationId: "listNearbyListings",
        parameters: [
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", minimum: -90, maximum: 90 }
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", minimum: -180, maximum: 180 }
          },
          {
            name: "radius_meters",
            in: "query",
            required: false,
            schema: { type: "number", minimum: 1, maximum: 50000, default: 5000 }
          }
        ],
        responses: {
          "200": {
            description: "Nearby active listings"
          },
          "400": {
            description: "Invalid nearby query"
          }
        }
      }
    }
  }
} as const;
