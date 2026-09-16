const CHAIN_ALIASES: Record<string, string> = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  base: 'base',
  polygon: 'polygon',
  matic: 'polygon',
  arbitrum: 'arbitrum',
  arb: 'arbitrum',
  avalanche: 'avalanche',
  avax: 'avalanche',
  bsc: 'bsc',
  bnb: 'bsc',
  solana: 'solana',
  sol: 'solana',
};

const EVM_RE = /0x[a-fA-F0-9]{40}\b/;
const BASE58_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;

export function extractChain(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [alias, chain] of Object.entries(CHAIN_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lower)) return chain;
  }
  return undefined;
}

export function extractEvmAddress(text: string): string | undefined {
  return text.match(EVM_RE)?.[0];
}

export function extractSolanaMint(text: string): string | undefined {
  const candidates = text.match(new RegExp(BASE58_RE.source, 'g')) ?? [];
  return candidates.find((c) => !c.startsWith('0x') && /[0-9]/.test(c));
}

/** chain+address pair, defaulting the chain when only an address is given */
export function extractChainAddress(text: string): { chain: string; address: string } | undefined {
  const evm = extractEvmAddress(text);
  if (evm) return { chain: extractChain(text) ?? 'base', address: evm };
  const mint = extractSolanaMint(text);
  if (mint) return { chain: 'solana', address: mint };
  return undefined;
}
