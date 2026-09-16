import type { Plugin } from '@elizaos/core';
import { tokenRiskAction } from './actions/tokenRisk.js';
import { solanaSignalsAction } from './actions/signals.js';
import { tokenAuthorityAction } from './actions/authority.js';
import { x402PricingAction } from './actions/pricing.js';

export const hostdefiPlugin: Plugin = {
  name: 'hostdefi-x402',
  description:
    'HostDeFi token-intelligence endpoints over x402 — token safety grades, Solana pre-graduation signals, mint/freeze authority analysis. Agents pay per call in USDC on Base (no API key, no signup).',
  config: {
    HOSTDEFI_EVM_PRIVATE_KEY: process.env.HOSTDEFI_EVM_PRIVATE_KEY,
    HOSTDEFI_X402_MAX_USDC: process.env.HOSTDEFI_X402_MAX_USDC,
    HOSTDEFI_X402_BASE_URL: process.env.HOSTDEFI_X402_BASE_URL,
  },
  actions: [tokenRiskAction, solanaSignalsAction, tokenAuthorityAction, x402PricingAction],
};

export default hostdefiPlugin;

export { tokenRiskAction, solanaSignalsAction, tokenAuthorityAction, x402PricingAction };
export { callPaidRoute, getPayingFetch, getBaseUrl } from './client.js';
export { extractChainAddress, extractSolanaMint, extractEvmAddress, extractChain } from './extract.js';
