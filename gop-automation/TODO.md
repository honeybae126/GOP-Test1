# GOP Automation Vercel Deployment Fix - TODO

## Approved Plan Steps:

- [x] 1. Update next.config.ts: Remove `output: 'standalone'` (use Vercel default serverless).
- [x] 2. Update package.json: Add `prisma generate &&` to build script.
- [x] 3. Create vercel.json with identity rewrites.
- [ ] 4. Run `cd gop-automation && npx prisma generate`.
- [ ] 5. Commit/push changes to Git.
- [ ] 6. Redeploy: `cd gop-automation && vercel --prod`.
- [ ] 7. Test https://your-vercel-url.vercel.app/auth/signin (public).
- [ ] 8. Check Vercel dashboard build logs for errors.


**Next step: Update configs and create vercel.json**

