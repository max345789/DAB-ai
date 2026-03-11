const crypto = require('crypto');

function safeCompare(a, b) {
  const aBuf = Buffer.from(a || '', 'utf8');
  const bBuf = Buffer.from(b || '', 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function signPayload(rawBody, timestamp, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
}

function createSignedHeaders(payload, secret) {
  const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const timestamp = String(Date.now());
  const signature = signPayload(rawBody, timestamp, secret);

  return {
    'content-type': 'application/json',
    'x-ai-signature': signature,
    'x-ai-timestamp': timestamp,
  };
}

function verifySignedPayload(rawBody, headers, secret, maxAgeMs = 5 * 60 * 1000) {
  const signature = headers['x-ai-signature'] || headers['X-AI-Signature'];
  const timestamp = headers['x-ai-timestamp'] || headers['X-AI-Timestamp'];

  if (!signature || !timestamp) {
    return { ok: false, reason: 'Missing signature headers' };
  }

  const tsNumber = Number(timestamp);
  if (!Number.isFinite(tsNumber) || Math.abs(Date.now() - tsNumber) > maxAgeMs) {
    return { ok: false, reason: 'Signature timestamp expired' };
  }

  const expected = signPayload(rawBody, timestamp, secret);
  if (!safeCompare(signature, expected)) {
    return { ok: false, reason: 'Invalid signature' };
  }

  return { ok: true };
}

module.exports = {
  createSignedHeaders,
  verifySignedPayload,
};
