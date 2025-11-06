import { pgPool } from '../../db/pg';
import { redis } from '../../db/redis';
import { hashKeyToInt32Pair } from '../../shared/hashing';
import type { ContactRow } from './identify.types';

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const v = String(email).trim().toLowerCase();
  return v.length ? v : null;
}

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const v = String(phone).trim();
  return v.length ? v : null;
}

function unique<T>(arr: (T | null | undefined)[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) {
    if (v == null) continue;
    if (!seen.has(v as T)) {
      seen.add(v as T);
      out.push(v as T);
    }
  }
  return out;
}

function formatResponse(groupRows: ContactRow[], primaryId: number) {
  const primary = groupRows.find((r) => r.id === primaryId);
  const emails = unique<string>([
    primary?.email ?? null,
    ...groupRows.map((r) => r.email)
  ]);
  const phoneNumbers = unique<string>([
    primary?.phoneNumber ?? null,
    ...groupRows.map((r) => r.phoneNumber)
  ]);
  const secondaryContactIds = groupRows
    .filter((r) => r.id !== primaryId)
    .map((r) => r.id);

  return {
    contact: {
      primaryContatctId: primaryId,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  };
}

export async function identify(params: { email?: string; phoneNumber?: string }) {
  const email = normalizeEmail(params.email);
  const phoneNumber = normalizePhone(params.phoneNumber);
  if (!email && !phoneNumber) {
    throw Object.assign(new Error('email or phoneNumber required'), { statusCode: 400 });
  }

  const cacheKey = `identify:${email ?? ''}:${phoneNumber ?? ''}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { high, low } = hashKeyToInt32Pair(`${email ?? ''}|${phoneNumber ?? ''}`);
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    // Use two-int32 variant to avoid bigint param typing issues
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [high, low]);

    // 1) Find direct matches by either email or phone
    const matchesRes = await client.query(
      `SELECT * FROM "Contact"
       WHERE ($1::text IS NOT NULL AND email = $1::text)
          OR ($2::text IS NOT NULL AND "phoneNumber" = $2::text)
       ORDER BY "createdAt" ASC`,
      [email, phoneNumber]
    );
    const matches: ContactRow[] = matchesRes.rows;

    if (matches.length === 0) {
      const insertRes = await client.query(
        `INSERT INTO "Contact" ("email", "phoneNumber", "linkPrecedence", "updatedAt")
         VALUES ($1, $2, 'primary', now()) RETURNING *`,
        [email, phoneNumber]
      );
      const created: ContactRow = insertRes.rows[0];
      await client.query('COMMIT');
      const out = formatResponse([created], created.id);
      await redis.set(cacheKey, JSON.stringify(out), 'EX', 120);
      return out;
    }

    // 2) Determine winner primary (oldest row among primaries, else oldest match)
    const primaries = matches.filter((m) => m.linkPrecedence === 'primary');
    let winner = primaries.length ? primaries[0] : matches[0];

    // 3) If multiple primaries, demote newer ones and reassign their secondaries
    if (primaries.length > 1) {
      const loserIds = primaries.map((p) => p.id).filter((id) => id !== winner.id);
      if (loserIds.length) {
        await client.query(
          `UPDATE "Contact"
           SET "linkedId" = $1, "linkPrecedence" = 'secondary', "updatedAt" = now()
           WHERE id = ANY($2::int[])`,
          [winner.id, loserIds]
        );
        await client.query(
          `UPDATE "Contact" SET "linkedId" = $1, "updatedAt" = now() WHERE "linkedId" = ANY($2::int[])`,
          [winner.id, loserIds]
        );
      }
    }

    // 4) See if incoming info is new to the group
    const groupRes = await client.query(
      `SELECT * FROM "Contact" WHERE id = $1 OR "linkedId" = $1 ORDER BY "createdAt" ASC`,
      [winner.id]
    );
    const groupRows: ContactRow[] = groupRes.rows;

    const hasEmail = !!(email && groupRows.some((r) => r.email === email));
    const hasPhone = !!(phoneNumber && groupRows.some((r) => r.phoneNumber === phoneNumber));
    const existsPair = !!(email && phoneNumber && groupRows.some((r) => r.email === email && r.phoneNumber === phoneNumber));

    if ((!hasEmail || !hasPhone) && !existsPair) {
      const insertRes = await client.query(
        `INSERT INTO "Contact" ("email", "phoneNumber", "linkedId", "linkPrecedence", "updatedAt")
         VALUES ($1, $2, $3, 'secondary', now()) RETURNING *`,
        [email, phoneNumber, winner.id]
      );
      groupRows.push(insertRes.rows[0] as ContactRow);
    }

    // 5) Finalize
    await client.query('COMMIT');
    const out = formatResponse(groupRows, winner.id);
    await redis.set(cacheKey, JSON.stringify(out), 'EX', 120);
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


