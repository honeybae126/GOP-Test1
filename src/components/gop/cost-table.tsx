'use client'

import React, { useState, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  type CostLineItem,
  type CostCategory,
  COST_CATEGORY_LABELS as LABELS,
} from '@/lib/mock-data'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toFixed(2)}`

const CATEGORY_ORDER: CostCategory[] = [
  'SURGICAL_STAFF',
  'ANAESTHESIA',
  'EQUIPMENT_INSTRUMENTS',
  'FACILITY_THEATRE',
  'IPD_WARD',
  'PHARMACY',
  'OTHER',
]

function groupByCategory(items: CostLineItem[]): Map<CostCategory, CostLineItem[]> {
  const map = new Map<CostCategory, CostLineItem[]>()
  for (const item of items) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  // Return in canonical category order
  const ordered = new Map<CostCategory, CostLineItem[]>()
  for (const cat of CATEGORY_ORDER) {
    if (map.has(cat)) ordered.set(cat, map.get(cat)!)
  }
  // Append any unknown categories at the end
  for (const [k, v] of map) {
    if (!ordered.has(k)) ordered.set(k, v)
  }
  return ordered
}

function recompute(item: CostLineItem): CostLineItem {
  const amount    = +((item.unit * item.unitPrice).toFixed(2))
  const netAmount = +((amount - item.discount).toFixed(2))
  return { ...item, amount, netAmount }
}

function makeBlankItem(category: CostCategory): CostLineItem {
  const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
  return { id, department: 'Miscellaneous', category, code: '', description: '', unit: 1, unitPrice: 0, amount: 0, discount: 0, netAmount: 0 }
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CostTableProps {
  lineItems:          CostLineItem[]
  cpi:                number
  pricingType:        'NORMAL' | 'DIFFERENT'
  pricingUnit?:       string | null
  marketingPackage?:  string | null
  employer?:          string | null
  coPayPercent?:      number    // from Coverage
  showCategorySubtotals?: boolean  // default true
  editable?:          boolean      // default false
  onUpdate?:          (items: CostLineItem[]) => void
  /** When true, renders with print-safe inline styles instead of Tailwind */
  printMode?:         boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CostTable({
  lineItems: initialItems,
  cpi,
  pricingType,
  pricingUnit,
  marketingPackage,
  employer,
  coPayPercent = 0,
  showCategorySubtotals = true,
  editable = false,
  onUpdate,
  printMode = false,
}: CostTableProps) {
  const [items, setItems] = useState<CostLineItem[]>(initialItems)

  // Sync if parent passes new items (e.g. after save)
  // (simple key-based approach: caller should remount on major changes)

  const update = useCallback((next: CostLineItem[]) => {
    setItems(next)
    onUpdate?.(next)
  }, [onUpdate])

  const handleFieldChange = (
    id: string,
    field: 'unit' | 'unitPrice' | 'discount' | 'description' | 'code',
    value: string,
  ) => {
    update(items.map(item => {
      if (item.id !== id) return item
      const numeric = (field === 'unit' || field === 'unitPrice' || field === 'discount')
      const raw     = numeric ? (parseFloat(value) || 0) : value
      return recompute({ ...item, [field]: raw })
    }))
  }

  const handleDelete = (id: string) => {
    update(items.filter(i => i.id !== id))
  }

  const handleAddItem = (category: CostCategory) => {
    update([...items, makeBlankItem(category)])
  }

  // ── Summary totals ─────────────────────────────────────────────────────────
  const subtotal      = +items.reduce((s, i) => s + i.amount,    0).toFixed(2)
  const totalDiscount = +items.reduce((s, i) => s + i.discount,  0).toFixed(2)
  const netAmount     = +items.reduce((s, i) => s + i.netAmount, 0).toFixed(2)
  const coPay         = +((netAmount * coPayPercent) / 100).toFixed(2)
  const insurerPayable = +(netAmount - coPay).toFixed(2)

  const grouped = groupByCategory(items)

  // ── Print mode renders with inline styles only ─────────────────────────────
  if (printMode) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 12 }}>
        {/* Metadata bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: '#555' }}>
          <span>CPI: {cpi} | Pricing: {pricingType}{pricingUnit ? ` — ${pricingUnit}` : ''}</span>
          <span>
            {marketingPackage && <>Package: {marketingPackage} &nbsp;·&nbsp;</>}
            {employer && <>Employer: {employer}</>}
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Department', 'Category', 'Code / Description', 'Unit', 'Price', 'Amount', 'Discount', 'Net Amount'].map(h => (
                <th key={h} style={{ textAlign: h === 'Department' || h === 'Category' || h === 'Code / Description' ? 'left' : 'right', padding: '5px 6px', background: '#f5f5f5', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #ddd' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([cat, catItems]) => {
              const catNet = +catItems.reduce((s, i) => s + i.netAmount, 0).toFixed(2)
              return (
                <React.Fragment key={cat}>
                  <tr>
                    <td colSpan={8} style={{ background: '#f0f4f8', fontWeight: 700, padding: '4px 8px', fontSize: 11, borderBottom: '1px solid #ddd' }}>
                      {LABELS[cat as CostCategory] ?? cat}
                    </td>
                  </tr>
                  {catItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '4px 6px' }}>{item.department}</td>
                      <td style={{ padding: '4px 6px', color: '#666' }}>{LABELS[item.category] ?? item.category}</td>
                      <td style={{ padding: '4px 6px' }}>
                        <div style={{ fontWeight: 500 }}>{item.description}</div>
                        {item.code && <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{item.code}</div>}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{item.unit}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{item.discount > 0 ? fmt(item.discount) : '—'}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.netAmount)}</td>
                    </tr>
                  ))}
                  {showCategorySubtotals && (
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <td colSpan={7} style={{ padding: '3px 6px', textAlign: 'right', fontSize: 11, color: '#555', fontStyle: 'italic' }}>
                        {LABELS[cat as CostCategory] ?? cat} Subtotal
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: 11, fontWeight: 600 }}>{fmt(catNet)}</td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7} style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, borderTop: '2px solid #ddd' }}>Subtotal</td>
              <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, borderTop: '2px solid #ddd' }}>{fmt(subtotal)}</td>
            </tr>
            {totalDiscount > 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '3px 6px', textAlign: 'right', color: '#666' }}>Total Discount</td>
                <td style={{ padding: '3px 6px', textAlign: 'right', color: '#666' }}>({fmt(totalDiscount)})</td>
              </tr>
            )}
            <tr>
              <td colSpan={7} style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>Net Amount</td>
              <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>{fmt(netAmount)}</td>
            </tr>
            {coPayPercent > 0 && (
              <>
                <tr>
                  <td colSpan={7} style={{ padding: '3px 6px', textAlign: 'right', color: '#666' }}>Co-pay ({coPayPercent}%)</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: '#666' }}>{fmt(coPay)}</td>
                </tr>
                <tr>
                  <td colSpan={7} style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, borderTop: '1px solid #ddd' }}>Amount Payable by Insurer</td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, borderTop: '1px solid #ddd', color: '#166534' }}>{fmt(insurerPayable)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>
    )
  }

  // ── Interactive / view mode ────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Metadata bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span>
          CPI: <strong className="text-foreground">{cpi}</strong>
          {' '}|{' '}Pricing: <strong className="text-foreground">{pricingType}</strong>
          {pricingType === 'DIFFERENT' && pricingUnit && (
            <span className="ml-1 text-foreground">{pricingUnit}</span>
          )}
        </span>
        <span className="flex items-center gap-3">
          {marketingPackage && (
            <span>Package: <strong className="text-foreground">{marketingPackage}</strong></span>
          )}
          {employer && (
            <span>Employer: <strong className="text-foreground">{employer}</strong></span>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Department</th>
              <th className="text-left px-3 py-2 font-medium">Category</th>
              <th className="text-left px-3 py-2 font-medium">Code / Description</th>
              <th className="text-right px-3 py-2 font-medium">Unit</th>
              <th className="text-right px-3 py-2 font-medium">Price</th>
              <th className="text-right px-3 py-2 font-medium">Amount</th>
              <th className="text-right px-3 py-2 font-medium">Discount</th>
              <th className="text-right px-3 py-2 font-medium">Net Amount</th>
              {editable && <th className="w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...grouped.entries()].map(([cat, catItems]) => {
              const catNet = +catItems.reduce((s, i) => s + i.netAmount, 0).toFixed(2)
              const label  = LABELS[cat as CostCategory] ?? cat
              return (
                <React.Fragment key={cat}>
                  {/* Category header */}
                  <tr className="bg-slate-50">
                    <td colSpan={editable ? 9 : 8} className="px-3 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {label}
                        </span>
                        {editable && (
                          <button
                            type="button"
                            onClick={() => handleAddItem(cat)}
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                          >
                            <Plus className="size-3" />
                            Add item
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Line item rows */}
{catItems.map((item, index) => (
                    <tr key={`${item.id}-${index}`} className="hover:bg-muted/20">
                      <td className="px-3 py-2 text-muted-foreground text-xs">{item.department}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{label}</td>
                      <td className="px-3 py-2">
                        {editable ? (
                          <Input
                            value={item.description}
                            onChange={e => handleFieldChange(item.id, 'description', e.target.value)}
                            className="h-7 text-xs"
                            placeholder="Description"
                          />
                        ) : (
                          <>
                            <div className="font-medium">{item.description}</div>
                            {item.code && <div className="text-[10px] text-muted-foreground font-mono">{item.code}</div>}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <Input
                            type="number" min={0} step={1}
                            value={item.unit}
                            onChange={e => handleFieldChange(item.id, 'unit', e.target.value)}
                            className="h-7 w-16 text-xs text-right ml-auto"
                          />
                        ) : item.unit}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <Input
                            type="number" min={0} step={0.01}
                            value={item.unitPrice}
                            onChange={e => handleFieldChange(item.id, 'unitPrice', e.target.value)}
                            className="h-7 w-24 text-xs text-right ml-auto"
                          />
                        ) : <span className="text-muted-foreground">{fmt(item.unitPrice)}</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {fmt(item.amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editable ? (
                          <Input
                            type="number" min={0} step={0.01}
                            value={item.discount}
                            onChange={e => handleFieldChange(item.id, 'discount', e.target.value)}
                            className="h-7 w-24 text-xs text-right ml-auto"
                          />
                        ) : (
                          <span className="text-muted-foreground">
                            {item.discount > 0 ? fmt(item.discount) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {fmt(item.netAmount)}
                      </td>
                      {editable && (
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Category subtotal */}
                  {showCategorySubtotals && (
                    <tr key={`sub-${cat}`} className="bg-muted/10">
                      <td colSpan={editable ? 8 : 7} className="px-3 py-1 text-right text-xs text-muted-foreground italic">
                        {label} Subtotal
                      </td>
                      <td className="px-3 py-1 text-right text-xs font-semibold">
                        {fmt(catNet)}
                      </td>
                      {editable && <td />}
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>

          {/* Summary footer */}
          <tfoot className="border-t-2 text-sm">
            <tr>
              <td colSpan={editable ? 8 : 7} className="px-3 pt-2 text-right font-medium text-muted-foreground">Subtotal</td>
              <td className="px-3 pt-2 text-right font-semibold">{fmt(subtotal)}</td>
              {editable && <td />}
            </tr>
            {totalDiscount > 0 && (
              <tr>
                <td colSpan={editable ? 8 : 7} className="px-3 py-1 text-right text-xs text-muted-foreground">Total Discount</td>
                <td className="px-3 py-1 text-right text-xs text-muted-foreground">({fmt(totalDiscount)})</td>
                {editable && <td />}
              </tr>
            )}
            <tr>
              <td colSpan={editable ? 8 : 7} className="px-3 py-1 text-right font-semibold">Net Amount</td>
              <td className="px-3 py-1 text-right font-semibold">{fmt(netAmount)}</td>
              {editable && <td />}
            </tr>
            {coPayPercent > 0 && (
              <>
                <tr>
                  <td colSpan={editable ? 8 : 7} className="px-3 py-1 text-right text-xs text-muted-foreground">
                    Co-pay ({coPayPercent}%)
                  </td>
                  <td className="px-3 py-1 text-right text-xs text-muted-foreground">{fmt(coPay)}</td>
                  {editable && <td />}
                </tr>
                <tr className="border-t">
                  <td colSpan={editable ? 8 : 7} className="px-3 py-2 text-right font-semibold">
                    Amount Payable by Insurer
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-green-700">{fmt(insurerPayable)}</td>
                  {editable && <td />}
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>

      {editable && onUpdate && (
        <p className="text-[10px] text-muted-foreground text-right">
          Changes are applied immediately. Use the save button above to confirm.
        </p>
      )}
    </div>
  )
}
