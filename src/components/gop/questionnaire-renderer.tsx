'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MockQuestionnaire, QuestionnaireItem, GOPStatus } from '@/lib/mock-data'
import { Sparkles, CheckCircle, AlertTriangle, Save, Lock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PrefillEntry {
  value: string | boolean | number
  aiPrefilled: boolean
  humanVerified: boolean
}

interface QuestionnaireRendererProps {
  questionnaire: MockQuestionnaire
  prefillMap: Record<string, PrefillEntry>
  gopStatus: GOPStatus
  hasAiPrefill: boolean
}

export function QuestionnaireRenderer({
  questionnaire,
  prefillMap,
  gopStatus,
  hasAiPrefill,
}: QuestionnaireRendererProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {}
    Object.entries(prefillMap).forEach(([linkId, entry]) => {
      initial[linkId] = typeof entry.value === 'number' ? String(entry.value) : entry.value
    })
    return initial
  })
  const [verified, setVerified] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.entries(prefillMap).forEach(([linkId, entry]) => {
      initial[linkId] = entry.humanVerified
    })
    return initial
  })
  const [saved, setSaved] = useState(false)

  const isReadOnly = gopStatus !== 'DRAFT'

  const aiFields = Object.entries(prefillMap).filter(([, e]) => e.aiPrefilled)
  const unverifiedAI = aiFields.filter(([linkId]) => !verified[linkId])

  const setValue = (linkId: string, value: string | boolean) => {
    setValues(prev => ({ ...prev, [linkId]: value }))
    setSaved(false)
  }

  const markVerified = (linkId: string) => {
    setVerified(prev => ({ ...prev, [linkId]: true }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    toast.success('Form saved successfully')
  }

  return (
    <div className="space-y-5">
      {/* AI prefill banner */}
      {hasAiPrefill && (
        <Alert variant="info">
          <Sparkles className="size-4" />
          <AlertTitle>AI-Assisted Prefill Active</AlertTitle>
          <AlertDescription>
            Claude AI has prefilled <strong>{aiFields.length}</strong> fields from the patient's FHIR records and uploaded medical reports.
            Fields marked with <Badge variant="outline" className="text-[9px] h-4 px-1 mx-0.5 bg-violet-50 text-violet-700 border-violet-200">AI</Badge> must be reviewed and confirmed.
            {unverifiedAI.length > 0 && (
              <span className="ml-1 text-amber-700 font-medium">{unverifiedAI.length} field(s) still need verification.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isReadOnly && (
        <Alert>
          <Lock className="size-4" />
          <AlertTitle>Read-Only View</AlertTitle>
          <AlertDescription>This form is locked because the request status is <strong>{gopStatus}</strong>.</AlertDescription>
        </Alert>
      )}

      {/* Sections */}
      {questionnaire.item.map(section => (
        <Card key={section.linkId}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {section.item?.map(field => (
              <FieldRenderer
                key={field.linkId}
                field={field}
                value={values[field.linkId]}
                isVerified={verified[field.linkId] ?? false}
                aiPrefilled={prefillMap[field.linkId]?.aiPrefilled ?? false}
                readOnly={isReadOnly || !!field.readOnly}
                onChange={(val) => setValue(field.linkId, val)}
                onVerify={() => markVerified(field.linkId)}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Save button */}
      {!isReadOnly && (
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} className="px-6">
            <Save className="size-3.5 mr-1.5" />
            Save Form
          </Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="size-4" />
              Saved
            </div>
          )}
          {unverifiedAI.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertTriangle className="size-4" />
              {unverifiedAI.length} AI field(s) unverified
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FieldRendererProps {
  field: QuestionnaireItem
  value?: string | boolean
  isVerified: boolean
  aiPrefilled: boolean
  readOnly: boolean
  onChange: (val: string | boolean) => void
  onVerify: () => void
}

function FieldRenderer({ field, value, isVerified, aiPrefilled, readOnly, onChange, onVerify }: FieldRendererProps) {
  const strValue = value === undefined ? '' : String(value)
  const boolValue = value === true || value === 'true'

  const hasAiContent = aiPrefilled && value !== undefined && value !== ''

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.linkId} className="text-sm font-medium">
          {field.text}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {aiPrefilled && (
          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-violet-50 text-violet-700 border-violet-200">
            <Sparkles className="size-2.5 mr-0.5" />
            AI
          </Badge>
        )}
        {field.readOnly && (
          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-slate-50 text-slate-500 border-slate-200">
            <Lock className="size-2.5 mr-0.5" />
            ANZER
          </Badge>
        )}
      </div>

      <div className={cn('flex gap-2', hasAiContent && !isVerified ? 'ring-2 ring-amber-400 rounded-lg p-0.5' : '')}>
        {field.type === 'text' ? (
          <Textarea
            id={field.linkId}
            value={strValue}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            className={cn(
              'flex-1 min-h-[80px]',
              readOnly && 'bg-muted cursor-default',
              hasAiContent && !isVerified && 'border-amber-400'
            )}
            placeholder={readOnly ? '—' : `Enter ${field.text.toLowerCase()}…`}
          />
        ) : field.type === 'boolean' ? (
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id={field.linkId}
              checked={boolValue}
              onChange={e => onChange(e.target.checked)}
              disabled={readOnly}
              className="size-4 rounded border-input"
            />
            <label htmlFor={field.linkId} className="text-sm text-muted-foreground">
              {field.text}
            </label>
          </div>
        ) : field.type === 'choice' && field.answerOption ? (
          <Select
            value={strValue}
            onValueChange={val => onChange(val)}
            disabled={readOnly}
          >
            <SelectTrigger
              id={field.linkId}
              className={cn(
                'flex-1',
                readOnly && 'bg-muted cursor-default',
                hasAiContent && !isVerified && 'border-amber-400'
              )}
            >
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {field.answerOption.map(opt => {
                const label = opt.valueString ?? opt.valueCoding?.display ?? ''
                return (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field.linkId}
            type={field.type === 'date' ? 'date' : field.type === 'decimal' ? 'number' : 'text'}
            value={strValue}
            onChange={e => onChange(e.target.value)}
            readOnly={readOnly}
            className={cn(
              'flex-1',
              readOnly && 'bg-muted cursor-default',
              hasAiContent && !isVerified && 'border-amber-400'
            )}
            placeholder={readOnly ? '—' : undefined}
          />
        )}

        {/* Verify button for AI fields */}
        {hasAiContent && !isVerified && !readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onVerify}
            className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-50"
          >
            <CheckCircle className="size-3.5 mr-1" />
            Verify
          </Button>
        )}
        {hasAiContent && isVerified && (
          <div className="flex items-center gap-1 text-green-600 text-xs shrink-0 px-2">
            <CheckCircle className="size-3.5" />
            Verified
          </div>
        )}
      </div>
    </div>
  )
}
