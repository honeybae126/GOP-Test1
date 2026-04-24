import sql from 'mssql'

// ⚠ ASSUMPTION: HIS_DATABASE_URL uses SQL Server ADO.NET connection string format:
// "Server=his-server.hospital.local,1433;Database=HIS;User Id=gop_readonly;Password=pass;Encrypt=True;TrustServerCertificate=True;ApplicationIntent=ReadOnly"
// ApplicationIntent=ReadOnly routes to a read-only replica when an Availability Group is in use.

// mssql parses the ADO.NET connection string automatically when passed as the sole argument.
// We construct the pool with the string directly rather than a config object.
const connectionString = process.env.HIS_DATABASE_URL ?? ''

declare global {
  // eslint-disable-next-line no-var
  var _hisPool: sql.ConnectionPool | undefined
}

/**
 * Returns a connected read-only SQL Server pool, or null if HIS is unavailable.
 * Never throws — callers treat null as "HIS offline, use manual entry".
 */
export async function getHisPool(): Promise<sql.ConnectionPool | null> {
  if (!process.env.HIS_DATABASE_URL) return null

  try {
    if (!global._hisPool) {
      global._hisPool = new sql.ConnectionPool(connectionString)
      await global._hisPool.connect()
    } else if (!global._hisPool.connected) {
      await global._hisPool.connect()
    }
    return global._hisPool
  } catch (err) {
    console.error('[HIS] Connection failed — falling back to manual entry:', err)
    global._hisPool = undefined
    return null
  }
}
