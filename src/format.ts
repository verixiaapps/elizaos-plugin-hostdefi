const PREFERRED_KEYS = [
  'symbol', 'name', 'grade', 'score', 'verdict', 'riskLevel', 'risk', 'chain', 'address', 'mint',
  'authority', 'mintAuthority', 'freezeAuthority', 'signals', 'summary', 'priceUsd', 'liquidityUsd',
];

function summarize(body: unknown): string {
  if (body === null || typeof body !== 'object') return String(body);
  const obj = body as Record<string, unknown>;
  const picked = Object.fromEntries(
    PREFERRED_KEYS.filter((k) => k in obj).map((k) => [k, obj[k]]),
  );
  const out = Object.keys(picked).length > 0 ? picked : obj;
  const s = JSON.stringify(out, null, 2);
  return s.length > 1800 ? `${s.slice(0, 1800)}…` : s;
}

/** True when the body looks like a 402 payment-required offer rather than data. */
export function isPaymentOffer(status: number, body: unknown): boolean {
  return status === 402 && body !== null && typeof body === 'object' && 'accepts' in (body as object);
}

export function firstOfferPrice(body: unknown): string | undefined {
  const accepts = (body as { accepts?: { maxAmountRequired?: string; network?: string; asset?: string }[] })
    ?.accepts;
  const a = accepts?.[0];
  if (!a?.maxAmountRequired) return undefined;
  const usd = Number(a.maxAmountRequired) / 1e6;
  return `$${usd.toFixed(4)} on ${a.network ?? 'unknown'}`;
}

export function formatData(title: string, body: unknown): string {
  return `${title}:\n\`\`\`json\n${summarize(body)}\n\`\`\``;
}
