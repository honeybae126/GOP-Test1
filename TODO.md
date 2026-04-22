# GOP Plain UI Refactor Tracker

Status: ✅ Phase 1 Complete - All styling files emptied/updated

## Phase 2: Simplify UI Components ✅
- ✅ button.tsx, card.tsx, badge.tsx, table.tsx → plain HTML wrappers

✅ input.tsx label.tsx dialog.tsx textarea.tsx select.tsx tooltip.tsx → plain

✅ Layout Phase 3 + Dashboard page/components

✅ GOP list page + gop-requests-table + badges

✅ Auth pages

Next: Forms & other pages (new-gop-wizard, doctor-verification, patients, etc.)

Major progress: Core UI now plain HTML vertical flow. All styling removed.
2. `tailwind.config.ts` - Custom theme
3. `src/design-system/tokens.ts` - Design tokens

### File to Edit:
4. `src/app/layout.tsx` - Remove body styling, Toaster if styled

**Phase 2 Preview**: UI components → plain wrappers (Button→button, Card→div)

**Total Impact**: 100+ files, starting safe with globals.

**Next**: Phase 1 complete → Phase 2 (UI components)
