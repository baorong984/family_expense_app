import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort as number,
      database: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    })
  }
  return pool
}

// 将参数中的 undefined 转换为 null
function normalizeParams(params?: any[]): any[] | undefined {
  if (!params) return undefined
  return params.map(p => p === undefined ? null : p)
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getPool()
  const [rows] = await pool.execute(sql, normalizeParams(params))
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results.length > 0 ? results[0] : null
}

export async function insert(sql: string, params?: any[]): Promise<number> {
  const pool = getPool()
  const [result] = await pool.execute(sql, normalizeParams(params))
  return (result as any).insertId
}

export async function update(sql: string, params?: any[]): Promise<number> {
  const pool = getPool()
  const [result] = await pool.execute(sql, normalizeParams(params))
  return (result as any).affectedRows
}

export async function remove(sql: string, params?: any[]): Promise<number> {
  const pool = getPool()
  const [result] = await pool.execute(sql, normalizeParams(params))
  return (result as any).affectedRows
}
