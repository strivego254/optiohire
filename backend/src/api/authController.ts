import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const SALT_ROUNDS = 10

async function ensureUsersTable() {
  await query(`
    create table if not exists users (
      user_id uuid primary key default gen_random_uuid(),
      email text unique not null,
      password_hash text not null,
      created_at timestamptz not null default now()
    );
  `)
}

export async function signup(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    await ensureUsersTable()
    const { rows: existing } = await query<{ user_id: string }>(
      `select user_id from users where email = $1`,
      [email.toLowerCase()]
    )
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Account already exists' })
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const { rows } = await query<{ user_id: string }>(
      `insert into users (email, password_hash) values ($1, $2) returning user_id`,
      [email.toLowerCase(), hash]
    )
    const userId = rows[0].user_id
    const token = jwt.sign({ sub: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({ token, user: { user_id: userId, email: email.toLowerCase() } })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create account' })
  }
}

export async function signin(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    await ensureUsersTable()
    const { rows } = await query<{ user_id: string; password_hash: string }>(
      `select user_id, password_hash from users where email = $1`,
      [email.toLowerCase()]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign({ sub: rows[0].user_id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(200).json({ token, user: { user_id: rows[0].user_id, email: email.toLowerCase() } })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to sign in' })
  }
}


