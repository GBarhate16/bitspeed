import { pgPool } from '../../db/pg';
import { ContactRow, LinkPrecedence } from './identify.types';

export async function findMatches(email?: string, phoneNumber?: string): Promise<ContactRow[]> {
  const client = await pgPool.connect();
  try {
    const res = await client.query(
      `SELECT * FROM "Contact"
       WHERE ($1::text IS NOT NULL AND email = $1::text)
          OR ($2::text IS NOT NULL AND "phoneNumber" = $2::text)
       ORDER BY "createdAt" ASC`,
      [email ?? null, phoneNumber ?? null]
    );
    return res.rows as ContactRow[];
  } finally {
    client.release();
  }
}

export async function createContact(params: {
  email?: string | null;
  phoneNumber?: string | null;
  linkedId?: number | null;
  linkPrecedence: LinkPrecedence;
}): Promise<ContactRow> {
  const { email = null, phoneNumber = null, linkedId = null, linkPrecedence } = params;
  const client = await pgPool.connect();
  try {
    const res = await client.query(
      `INSERT INTO "Contact" ("email", "phoneNumber", "linkedId", "linkPrecedence", "updatedAt")
       VALUES ($1, $2, $3, $4, now())
       RETURNING *`,
      [email, phoneNumber, linkedId, linkPrecedence]
    );
    return res.rows[0] as ContactRow;
  } finally {
    client.release();
  }
}

export async function markPrimariesAsSecondary(loserIds: number[], winnerId: number): Promise<void> {
  if (!loserIds.length) return;
  const client = await pgPool.connect();
  try {
    await client.query(
      `UPDATE "Contact"
       SET "linkedId" = $1, "linkPrecedence" = 'secondary', "updatedAt" = now()
       WHERE id = ANY($2::int[])`,
      [winnerId, loserIds]
    );
  } finally {
    client.release();
  }
}

export async function reassignSecondariesToWinner(loserIds: number[], winnerId: number): Promise<void> {
  if (!loserIds.length) return;
  const client = await pgPool.connect();
  try {
    await client.query(
      `UPDATE "Contact"
       SET "linkedId" = $1, "updatedAt" = now()
       WHERE "linkedId" = ANY($2::int[])`,
      [winnerId, loserIds]
    );
  } finally {
    client.release();
  }
}

export async function fetchGroupByWinnerId(winnerId: number): Promise<ContactRow[]> {
  const client = await pgPool.connect();
  try {
    const res = await client.query(
      `SELECT * FROM "Contact"
       WHERE id = $1 OR "linkedId" = $1
       ORDER BY "createdAt" ASC`,
      [winnerId]
    );
    return res.rows as ContactRow[];
  } finally {
    client.release();
  }
}


