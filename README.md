# elizaos-plugin-hostdefi

ElizaOS plugin giving agents access to [HostDeFi](https://hostdefi.com)'s token-intelligence API over the **x402 payment protocol** — agents pay per call in USDC on Base, no API key and no signup required.

## Actions

| Action | What it does | Price/call |
|---|---|---|
| `HOSTDEFI_TOKEN_RISK` | Rug/scam safety grade for a token on Solana or EVM chains | ~$0.02 |
| `HOSTDEFI_SOLANA_SIGNALS` | Pre-graduation / early trading signals for a Solana mint | ~$0.05 |
| `HOSTDEFI_TOKEN_AUTHORITY` | Mint/freeze authority inspection for a Solana mint | ~$0.05 |
| `HOSTDEFI_X402_PRICING` | List the full 23-endpoint paid catalog | free |

Prices are live in the catalog (`GET /v1/x402/pricing`); exact USDC amounts come back in each 402 offer.

## Install

```bash
npm install elizaos-plugin-hostdefi
```

Or straight from GitHub (no npm account needed):

```bash
npm install github:verixiaapps/elizaos-plugin-hostdefi
```

Add to your agent's plugins:

```ts
import { hostdefiPlugin } from 'elizaos-plugin-hostdefi';

const agent = {
  // ... character config
  plugins: [hostdefiPlugin],
};
```

## Configuration

| Env var | Required | Purpose |
|---|---|---|
| `HOSTDEFI_EVM_PRIVATE_KEY` | for paid calls | Hex private key (0x…) of the agent's paying wallet. Fund it with a few USDC on **Base**. Without it, actions report the call's price instead of paying. |
| `HOSTDEFI_X402_MAX_USDC` | no | Per-call spend cap in USDC, default `0.25`. Payments above this are refused before signing — the agent can never overspend a single call. |
| `HOSTDEFI_X402_BASE_URL` | no | API base, default `https://hostdefi.com/api`. |

The agent only needs USDC — settlement is gasless (EIP-3009 `transferWithAuthorization`, signed off-chain, relayed by the facilitator).

## How it works

On a paid route the plugin:

1. calls the endpoint; the server answers `402` with USDC offers on Solana + four EVM chains
2. signs a `transferWithAuthorization` for the cheapest acceptable Base offer via `x402-fetch`
3. retries with the payment — the server verifies, runs the handler, settles on-chain, and returns the data with an `X-PAYMENT-RESPONSE` receipt

Charge-on-success semantics: only `2xx` responses are charged; errors are never billed.

## Example

> **user:** is this token a rug? solana `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
>
> **agent:** *(pays $0.02 USDC on Base)* Token risk for DezXAZ… on solana: `{ "grade": "B", "score": 72, … }`

## Notes

- The wallet funds stay under the agent's control — this plugin never moves funds except per-call payments capped by `HOSTDEFI_X402_MAX_USDC`.
- Full endpoint reference: https://hostdefi.com/api/v1/x402/pricing · well-known manifest: https://hostdefi.com/.well-known/x402
- Registry listings: x402scan, PayAI Bazaar, CDP Bazaar, 402index, agent-tools.cloud.
