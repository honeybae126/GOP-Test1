'use client'

export function MonthlyTrendChart({ data }: any) {
  return (
    <div style={{ padding: '20px', border: '1px solid gray', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>Monthly GOP Activity</h3>
      <p style={{ color: 'gray' }}>Submissions, approvals, and rejections per month. Data: Stable trend.</p>
    </div>
  )
}
