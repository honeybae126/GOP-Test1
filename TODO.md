# GOP Automation System - Build TODO

## Phase 1: Project Setup ✅

- [x] Create TODO.md  
- [x] 1. Create project structure with Next.js 16, TypeScript, Tailwind, Shadcn/UI ✅  

- [x] 2. Set up Prisma for app metadata (users, insurers, configs) with PostgreSQL ✅  

- [ ] 3. Docker Compose for local stack: Next.js, Postgres (app + FHIR), HAPI FHIR server  
- [ ] 4. Auth.js config for Microsoft Entra ID (mock initially)  
- [ ] 5. FHIR client library (lib/fhir.ts)  

## Phase 2: Core Data Models & API

- [ ] 6. Define Prisma schema for non-canonical data  
- [ ] 7. Create API routes: patients/search, gop/create, questionnaire/[id]/response  
- [ ] 8. Mock ANZER adapter → FHIR seed script  
- [ ] 9. Role-based auth middleware  

## Phase 3: UI - Vertical Slice

- [ ] 10. Dashboard layout with role-based views  
- [ ] 11. Patient search page + card  
- [ ] 12. GOP request form → Task creation  
- [ ] 13. APRIL Questionnaire renderer  
- [ ] 14. AI prefill mock  
- [ ] 15. PDF generator  
- [ ] 16. Email dispatch  
- [ ] 17. Admin dashboard  

## Phase 4: Polish & Testing

- [ ] 18. Error handling, loading states  
- [ ] 19. Seed script for demo data  
- [ ] 20. Full e2e test of vertical slice  

**Next Step: Prisma setup (step 2)**  
**Status: UI base ready (Shadcn partial)**

