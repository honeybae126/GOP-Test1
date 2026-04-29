# GOP Automation Project Run Fix

## Steps:
- [x] 1. Edit src/lib/env.ts to add preprocess fallbacks and optional Azure vars
- [x] 2. Edit src/lib/auth.ts to conditional Azure provider and always enable demo auth
- [x] 3. Run `npx prisma generate`
- [x] 4. Restart dev server (`npm run dev`)
- [x] 5. Test login with demo: staff@intercare.com / gop123
