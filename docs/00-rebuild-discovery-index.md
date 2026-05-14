# Save&Serve Rebuild Discovery Index

Discovery source: `save-serve-pr` on branch `main`.

Discovery date: 2026-05-14.

Scope: technical discovery and rebuild planning only. No application code has been rewritten.

Documents:

1. [Current Repository Analysis](./01-current-repository-analysis.md)
2. [Product Modules And User Flows](./02-product-modules-and-user-flows.md)
3. [Target Architecture Recommendation](./03-target-architecture-recommendation.md)
4. [Backend Architecture Recommendation](./04-backend-architecture-recommendation.md)
5. [Database Design Draft](./05-database-design-draft.md)
6. [API Design Draft](./06-api-design-draft.md)
7. [Mobile Architecture Approach](./07-mobile-architecture-approach.md)
8. [Phased Migration Plan](./08-phased-migration-plan.md)
9. [Risks, Unknowns, And Assumptions](./09-risks-unknowns-and-assumptions.md)
10. [Recommended Next Implementation Order](./10-recommended-next-implementation-order.md)

## Primary Recommendation

Rebuild as a TypeScript modular monolith rather than microservices:

- React/Vite web and Capacitor mobile clients continue initially.
- A custom TypeScript API owns business logic now split between Base44 entities, frontend pages, and Base44 server functions.
- PostgreSQL with PostGIS becomes the primary data store.
- Object storage, Redis-backed jobs, Stripe, Firebase Cloud Messaging, email/SMS, and Google Places become explicit infrastructure dependencies.
- Migration happens module-by-module behind a client-side API adapter, not through a full rewrite.

