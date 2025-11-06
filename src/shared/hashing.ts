import crypto from 'crypto';

export function hashKeyToBigInt(key: string): bigint {
  const digest = crypto.createHash('sha256').update(key).digest();
  let num = BigInt(0);
  for (let i = 0; i < 8; i++) {
    num = (num << BigInt(8)) + BigInt(digest[i]);
  }
  // Map to signed 64-bit range for Postgres BIGINT
  return BigInt.asIntN(64, num);
}

export function hashKeyToInt32Pair(key: string): { high: number; low: number } {
  const big = hashKeyToBigInt(key);
  // Extract high and low 32-bit signed integers
  const lowBig = BigInt.asIntN(32, big);
  const highBig = BigInt.asIntN(32, big >> BigInt(32));
  // Convert to JS numbers (within 32-bit signed range)
  const low = Number(lowBig);
  const high = Number(highBig);
  return { high, low };
}


