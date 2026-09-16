import type { IAgentRuntime } from '@elizaos/core';
import { createSigner, wrapFetchWithPayment, type Signer } from 'x402-fetch';
import { getSetting } from './settings.js';

const DEFAULT_BASE_URL = 'https://hostdefi.com/api';
const DEFAULT_MAX_USDC = '0.25';
const PAYMENT_NETWORK = 'base';

let signerPromise: Promise<Signer | null> | null = null;

function usdcToBaseUnits(usdc: string): bigint {
  const parts = usdc.split('.');
  const whole = BigInt(parts[0] || '0');
  const frac = BigInt((parts[1] || '').padEnd(6, '0').slice(0, 6) || '0');
  return whole * 1_000_000n + frac;
}

async function buildSigner(runtime: IAgentRuntime): Promise<Signer | null> {
  const key = getSetting(runtime, 'HOSTDEFI_EVM_PRIVATE_KEY') ?? getSetting(runtime, 'EVM_PRIVATE_KEY');
  if (!key) return null;
  const normalized = key.startsWith('0x') ? key : `0x${key}`;
  return createSigner(PAYMENT_NETWORK, normalized as `0x${string}`);
}

/**
 * A fetch that automatically pays 402s in USDC on Base, or null when no
 * paying key is configured. `maxUsdc` caps each payment before signing.
 */
export async function getPayingFetch(
  runtime: IAgentRuntime,
): Promise<{ fetchWithPay: typeof fetch } | null> {
  signerPromise ??= buildSigner(runtime);
  const signer = await signerPromise;
  if (!signer) return null;
  const maxUsdc = getSetting(runtime, 'HOSTDEFI_X402_MAX_USDC') ?? DEFAULT_MAX_USDC;
  const fetchWithPay = wrapFetchWithPayment(fetch, signer, usdcToBaseUnits(maxUsdc));
  return { fetchWithPay };
}

export function getBaseUrl(runtime: IAgentRuntime): string {
  return (getSetting(runtime, 'HOSTDEFI_X402_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export interface CallResult {
  status: number;
  body: unknown;
  paid: boolean;
}

/**
 * Call a paid HostDeFi route. When a paying key is configured the 402 is
 * settled transparently; without one we still hit the route unpaid so the
 * caller can surface the offer price to the agent.
 */
export async function callPaidRoute(runtime: IAgentRuntime, path: string): Promise<CallResult> {
  const paying = await getPayingFetch(runtime);
  const url = `${getBaseUrl(runtime)}${path}`;
  const res = paying ? await paying.fetchWithPay(url) : await fetch(url);
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body, paid: paying !== null };
}
