import type { Action, ActionResult } from '@elizaos/core';
import { callPaidRoute } from '../client.js';
import { extractChainAddress } from '../extract.js';
import { firstOfferPrice, formatData, isPaymentOffer } from '../format.js';

export const tokenRiskAction: Action = {
  name: 'HOSTDEFI_TOKEN_RISK',
  similes: ['CHECK_TOKEN_SAFETY', 'TOKEN_SAFETY_CHECK', 'IS_TOKEN_SAFE', 'RUG_CHECK', 'TOKEN_RISK_SCORE'],
  description:
    'Grade a token\'s rug/scam risk on Solana or EVM chains using HostDeFi\'s token-risk engine. Pays per call in USDC via x402 (no API key needed). Use when the user asks whether a token is safe, a rug, or wants a risk grade for a contract address or mint.',
  validate: async (_runtime, message) => {
    const text = message?.content?.text ?? '';
    return extractChainAddress(text) !== undefined;
  },
  handler: async (runtime, message, _state, _options, callback): Promise<ActionResult | void> => {
    const text = message?.content?.text ?? '';
    const target = extractChainAddress(text);
    if (!target) {
      await callback?.({ text: 'I need a contract address or mint to check — e.g. `token risk base 0x…` or a Solana mint.' });
      return { success: false, error: 'no address found in message' };
    }
    const { status, body, paid } = await callPaidRoute(runtime, `/v1/x402/token-risk/${target.chain}/${target.address}`);
    if (status === 200) {
      await callback?.({ text: formatData(`Token risk for ${target.address} on ${target.chain}`, body) });
      return { success: true, data: { result: body } };
    }
    if (isPaymentOffer(status, body)) {
      const price = firstOfferPrice(body);
      await callback?.({
        text: `Token-risk check costs ${price ?? 'a small USDC fee'} per call via x402. Configure HOSTDEFI_EVM_PRIVATE_KEY with a USDC-funded wallet on Base to pay automatically.`,
      });
      return { success: false, error: 'payment required; no paying wallet configured' };
    }
    await callback?.({
      text: `Token-risk lookup failed (HTTP ${status})${paid ? '' : ' — unpaid probe'}: ${JSON.stringify(body).slice(0, 400)}`,
    });
    return { success: false, error: `HTTP ${status}` };
  },
  examples: [
    [
      { name: '{{user1}}', content: { text: 'is this token a rug? solana DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' } },
      { name: '{{agent}}', content: { text: 'Token risk for DezXAZ… on solana: {grade, score, …}', actions: ['HOSTDEFI_TOKEN_RISK'] } },
    ],
    [
      { name: '{{user1}}', content: { text: 'token risk base 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' } },
      { name: '{{agent}}', content: { text: 'Token risk for 0x8335… on base: {grade, score, …}', actions: ['HOSTDEFI_TOKEN_RISK'] } },
    ],
  ],
};
