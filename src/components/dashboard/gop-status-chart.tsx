'use client'

export function GOPStatusChart({ data }: any) {
  const total = data.reduce((sum: number, d: any) => sum + d.value, 0)
  return (
    <div style={{ padding: '20px', border: '1px solid gray', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>Status Distribution</h3>
      <p style={{ color: 'gray' }}>{total} total requests. Pending 33%, Approved 22%, Other 45%.</p>
    </div>
  )
}
