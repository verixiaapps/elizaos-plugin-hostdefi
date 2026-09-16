import type { Action, ActionResult } from '@elizaos/core';
import { getBaseUrl } from '../client.js';

interface CatalogResource {
  path?: string;
  url?: string;
  price?: string;
  description?: string;
  method?: string;
}

export const x402PricingAction: Action = {
  name: 'HOSTDEFI_X402_PRICING',
  similes: ['LIST_PAID_ENDPOINTS', 'X402_CATALOG', 'HOSTDEFI_PRICES', 'AGENT_API_CATALOG'],
  description:
    'List HostDeFi\'s machine-payable API catalog — every x402 endpoint, its price in USDC, and what it returns. Free to call. Use when the user asks what paid/agent endpoints exist or what they cost.',
  validate: async (_runtime, message) => {
    const text = (message?.content?.text ?? '').toLowerCase();
    return /pricing|catalog|endpoint|x402|hostdefi|api/.test(text);
  },
  handler: async (runtime, _message, _state, _options, callback): Promise<ActionResult | void> => {
    const res = await fetch(`${getBaseUrl(runtime)}/v1/x402/pricing`);
    if (!res.ok) {
      await callback?.({ text: `Couldn't fetch the pricing catalog (HTTP ${res.status}).` });
      return { success: false, error: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as { resources?: CatalogResource[] };
    const resources = body.resources ?? [];
    const lines = resources.slice(0, 30).map((r) => {
      const path = r.path ?? r.url ?? '?';
      return `- \`${r.method ?? 'GET'} ${path}\` — ${r.price ?? '?'}${r.description ? ` — ${r.description}` : ''}`;
    });
    await callback?.({
      text: `HostDeFi x402 catalog (${resources.length} endpoints, pay-per-call USDC):\n${lines.join('\n')}`,
    });
    return { success: true, data: { result: body } };
  },
  examples: [
    [
      { name: '{{user1}}', content: { text: 'what paid endpoints does hostdefi have?' } },
      { name: '{{agent}}', content: { text: 'HostDeFi x402 catalog (…)', actions: ['HOSTDEFI_X402_PRICING'] } },
    ],
  ],
};
