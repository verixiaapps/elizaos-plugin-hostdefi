import type { Action, ActionResult } from '@elizaos/core';
import { callPaidRoute } from '../client.js';
import { extractSolanaMint } from '../extract.js';
import { firstOfferPrice, formatData, isPaymentOffer } from '../format.js';

export const solanaSignalsAction: Action = {
  name: 'HOSTDEFI_SOLANA_SIGNALS',
  similes: ['SOLANA_TOKEN_SIGNALS', 'PRE_GRADUATION_SIGNALS', 'PUMP_FUN_SIGNALS', 'EARLY_TOKEN_SIGNALS'],
  description:
    'Get HostDeFi\'s pre-graduation/trading signals for a Solana token mint — early-stage token metrics scarce elsewhere. Pays per call in USDC via x402. Use when the user asks for signals on a Solana mint or bonding-curve token.',
  validate: async (_runtime, message) => {
    const text = message?.content?.text ?? '';
    return extractSolanaMint(text) !== undefined && !/0x[a-fA-F0-9]{40}/.test(text);
  },
  handler: async (runtime, message, _state, _options, callback): Promise<ActionResult | void> => {
    const text = message?.content?.text ?? '';
    const mint = extractSolanaMint(text);
    if (!mint) {
      await callback?.({ text: 'I need a Solana mint address (base58, ~44 chars) to pull signals.' });
      return { success: false, error: 'no solana mint found in message' };
    }
    const { status, body, paid } = await callPaidRoute(runtime, `/v1/x402/signals/solana/${mint}`);
    if (status === 200) {
      await callback?.({ text: formatData(`Signals for solana/${mint}`, body) });
      return { success: true, data: { result: body } };
    }
    if (isPaymentOffer(status, body)) {
      const price = firstOfferPrice(body);
      await callback?.({
        text: `Signals lookup costs ${price ?? 'a small USDC fee'} per call via x402. Configure HOSTDEFI_EVM_PRIVATE_KEY with a USDC-funded wallet on Base to pay automatically.`,
      });
      return { success: false, error: 'payment required; no paying wallet configured' };
    }
    await callback?.({
      text: `Signals lookup failed (HTTP ${status})${paid ? '' : ' — unpaid probe'}: ${JSON.stringify(body).slice(0, 400)}`,
    });
    return { success: false, error: `HTTP ${status}` };
  },
  examples: [
    [
      { name: '{{user1}}', content: { text: 'signals on So11111111111111111111111111111111111111112' } },
      { name: '{{agent}}', content: { text: 'Signals for solana/So1111…', actions: ['HOSTDEFI_SOLANA_SIGNALS'] } },
    ],
  ],
};
