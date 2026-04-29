'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, ChevronRight, PlusCircle } from 'lucide-react'

interface HisPatient {
  patientId: string
  fullName:  string
  dob:       string
  nric:      string
}

export function PatientSearchList() {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<HisPatient[]>([])
  const [loading,  setLoading]  = useState(false)
  const [offline,  setOffline]  = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/his/patients?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.offline) { setOffline(true); setResults([]) }
        else { setOffline(false); setResults(Array.isArray(data) ? data : (data.results ?? [])) }
      } catch { setOffline(true); setResults([]) }
      finally { setLoading(false); setSearched(true) }
    }, 350)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  function calcAge(dob: string) {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div
        className="flex items-center gap-3 flex-wrap p-3 rounded-xl"
        style={{ background: '#FFFFFF', border: '1px solid #D8DEF0' }}
      >
        <div className="relative flex-1" style={{ minWidth: 240, maxWidth: 380 }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5"
            style={{ color: '#9BA3B8' }}
          />
          <input
            placeholder="Search by name or NRIC…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg outline-none transition-colors"
            style={{ background: '#F5F7FF', border: '1px solid #D8DEF0', color: '#1A1F3C' }}
          />
        </div>

        <span className="ml-auto text-xs font-medium" style={{ color: '#6B7494' }}>
          {searched && !loading ? `${results.length} patient${results.length !== 1 ? 's' : ''} found` : ''}
        </span>
      </div>

      {/* Offline banner */}
      {offline && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#FFF7ED', border: '1px solid #FDE68A', color: '#92400E' }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }} />
          HIS is currently unreachable. Patient search is unavailable.
        </div>
      )}

      {/* Empty prompt */}
      {!searched && !loading && !offline && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ background: '#FFFFFF', border: '1px dashed #D8DEF0' }}
        >
          <Search className="size-8 mb-3" style={{ color: '#D8DEF0' }} />
          <p className="text-sm font-medium" style={{ color: '#1A1F3C' }}>Search for a patient</p>
          <p className="text-xs mt-1" style={{ color: '#6B7494' }}>Type at least 2 characters to search the HIS</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <i className="fas fa-spinner fa-spin" style={{ color: '#9BA3B8', fontSize: 20 }} />
        </div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && !offline && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ background: '#FFFFFF', border: '1px dashed #D8DEF0' }}
        >
          <Search className="size-8 mb-3" style={{ color: '#D8DEF0' }} />
          <p className="text-sm font-medium" style={{ color: '#1A1F3C' }}>No patients found</p>
          <p className="text-xs mt-1" style={{ color: '#6B7494' }}>Try a different name or NRIC</p>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map(p => (
            <div
              key={p.patientId}
              className="bg-white rounded-2xl flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
              style={{ border: '1px solid #D8DEF0', boxShadow: '0 2px 8px rgba(45,107,244,0.06)' }}
            >
              <div className="p-4 flex items-start gap-3" style={{ borderBottom: '1px solid #F0F2F8' }}>
                <div
                  className="size-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: '#EEF3FF', color: '#2D6BF4' }}
                >
                  {p.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#1A1F3C' }}>{p.fullName}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6B7494' }}>
                    {p.dob ? `${calcAge(p.dob)} yrs` : '—'}
                    <span
                      className="ml-2 font-mono font-semibold px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background: '#F0F2F8', color: '#6B7494' }}
                    >
                      {p.nric}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 flex gap-2 mt-auto">
                <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs rounded-lg">
                  <Link href={`/patients/${p.patientId}`}>
                    View Details <ChevronRight className="size-3" />
                  </Link>
                </Button>
                <Button size="sm" asChild className="h-8 text-xs rounded-lg px-3">
                  <Link href={`/gop/new?patientId=${p.patientId}`}>
                    <PlusCircle className="size-3" /> GOP
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
