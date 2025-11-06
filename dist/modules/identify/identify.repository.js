"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatches = findMatches;
exports.createContact = createContact;
exports.markPrimariesAsSecondary = markPrimariesAsSecondary;
exports.reassignSecondariesToWinner = reassignSecondariesToWinner;
exports.fetchGroupByWinnerId = fetchGroupByWinnerId;
const pg_1 = require("../../db/pg");
async function findMatches(email, phoneNumber) {
    const client = await pg_1.pgPool.connect();
    try {
        const res = await client.query(`SELECT * FROM "Contact"
       WHERE ($1::text IS NOT NULL AND email = $1::text)
          OR ($2::text IS NOT NULL AND "phoneNumber" = $2::text)
       ORDER BY "createdAt" ASC`, [email ?? null, phoneNumber ?? null]);
        return res.rows;
    }
    finally {
        client.release();
    }
}
async function createContact(params) {
    const { email = null, phoneNumber = null, linkedId = null, linkPrecedence } = params;
    const client = await pg_1.pgPool.connect();
    try {
        const res = await client.query(`INSERT INTO "Contact" ("email", "phoneNumber", "linkedId", "linkPrecedence", "updatedAt")
       VALUES ($1, $2, $3, $4, now())
       RETURNING *`, [email, phoneNumber, linkedId, linkPrecedence]);
        return res.rows[0];
    }
    finally {
        client.release();
    }
}
async function markPrimariesAsSecondary(loserIds, winnerId) {
    if (!loserIds.length)
        return;
    const client = await pg_1.pgPool.connect();
    try {
        await client.query(`UPDATE "Contact"
       SET "linkedId" = $1, "linkPrecedence" = 'secondary', "updatedAt" = now()
       WHERE id = ANY($2::int[])`, [winnerId, loserIds]);
    }
    finally {
        client.release();
    }
}
async function reassignSecondariesToWinner(loserIds, winnerId) {
    if (!loserIds.length)
        return;
    const client = await pg_1.pgPool.connect();
    try {
        await client.query(`UPDATE "Contact"
       SET "linkedId" = $1, "updatedAt" = now()
       WHERE "linkedId" = ANY($2::int[])`, [winnerId, loserIds]);
    }
    finally {
        client.release();
    }
}
async function fetchGroupByWinnerId(winnerId) {
    const client = await pg_1.pgPool.connect();
    try {
        const res = await client.query(`SELECT * FROM "Contact"
       WHERE id = $1 OR "linkedId" = $1
       ORDER BY "createdAt" ASC`, [winnerId]);
        return res.rows;
    }
    finally {
        client.release();
    }
}
