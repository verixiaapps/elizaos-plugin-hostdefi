import type { Action, ActionResult } from '@elizaos/core';
import { callPaidRoute } from '../client.js';
import { extractSolanaMint } from '../extract.js';
import { firstOfferPrice, formatData, isPaymentOffer } from '../format.js';

export const tokenAuthorityAction: Action = {
  name: 'HOSTDEFI_TOKEN_AUTHORITY',
  similes: ['MINT_AUTHORITY_CHECK', 'FREEZE_AUTHORITY_CHECK', 'TOKEN_AUTHORITIES', 'AUTHORITY_ANALYSIS'],
  description:
    'Inspect a Solana token\'s mint/freeze authority state via HostDeFi — who can mint more or freeze wallets. Pays per call in USDC via x402. Use when the user asks about mint authority, freeze authority, or centralization risk of a Solana mint.',
  validate: async (_runtime, message) => {
    const text = message?.content?.text ?? '';
    return /authority|mint.?able|freez/i.test(text) && extractSolanaMint(text) !== undefined;
  },
  handler: async (runtime, message, _state, _options, callback): Promise<ActionResult | void> => {
    const text = message?.content?.text ?? '';
    const mint = extractSolanaMint(text);
    if (!mint) {
      await callback?.({ text: 'I need a Solana mint address to check its authorities.' });
      return { success: false, error: 'no solana mint found in message' };
    }
    const { status, body, paid } = await callPaidRoute(runtime, `/v1/x402/authority/solana/${mint}`);
    if (status === 200) {
      await callback?.({ text: formatData(`Authority analysis for solana/${mint}`, body) });
      return { success: true, data: { result: body } };
    }
    if (isPaymentOffer(status, body)) {
      const price = firstOfferPrice(body);
      await callback?.({
        text: `Authority check costs ${price ?? 'a small USDC fee'} per call via x402. Configure HOSTDEFI_EVM_PRIVATE_KEY with a USDC-funded wallet on Base to pay automatically.`,
      });
      return { success: false, error: 'payment required; no paying wallet configured' };
    }
    await callback?.({
      text: `Authority lookup failed (HTTP ${status})${paid ? '' : ' — unpaid probe'}: ${JSON.stringify(body).slice(0, 400)}`,
    });
    return { success: false, error: `HTTP ${status}` };
  },
  examples: [
    [
      { name: '{{user1}}', content: { text: 'can anyone mint more of So11111111111111111111111111111111111111112?' } },
      { name: '{{agent}}', content: { text: 'Authority analysis for solana/So1111…', actions: ['HOSTDEFI_TOKEN_AUTHORITY'] } },
    ],
  ],
};
