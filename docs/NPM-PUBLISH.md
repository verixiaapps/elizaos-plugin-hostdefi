# Publishing `@verixiaapps/elizaos-plugin-hostdefi` — operator notes

Everything a Devin session needs to cut a new release. No credentials live in
this file or this repo — values are Devin **org secrets**, referenced by name
only.

## State of the account

- npmjs account: **`verixiaappstest`** — member of the **`verixiaapps`** npm
  org, which owns the `@verixiaapps` scope (there is also a `verixia` org).
- Account email: a mail.tm mailbox (`NPM_MAILBOX_EMAIL`) — npm login OTPs land
  there and are machine-readable.
- Package: `@verixiaapps/elizaos-plugin-hostdefi` (first published
  2026-09-16 as 1.0.0).
- elizaOS plugin discovery: the `elizaos-plugins/registry` GitHub registry is
  retired (404). Discovery runs on the package's `elizaos-plugin` npm keyword —
  keep it in `package.json.keywords`. No registry PR is needed or possible.

## Normal publish

```bash
printf '//registry.npmjs.org/:_authToken=%s' "$NPM_VERIXIAAPPS_PUBLISH_TOKEN" > .npmrc
npm version patch            # or minor — bump first, always
npm publish --access public  # 'prepare' builds dist/ on publish
```

The stored token is an npm **automation** token with `bypass_2fa` — it works
non-interactively from a Devin box (registry.npmjs.org is reachable; only the
www.npmjs.com site is DataDome-hostile to datacenter IPs).

## When the token dies (current one expires 2026-12-15)

registry.npmjs.org accepts the token API but www.npmjs.com **blocks Devin
egress IPs at signup/login** — that's why the account was created from the
owner's browser. To re-mint a token a session needs either the owner's browser
again, or luck with the login page:

1. Log in at npmjs.com as `verixiaappstest` + `NPM_ACCOUNT_PASSWORD`.
2. OTP: mail.tm mailbox — `POST https://api.mail.tm/token` with
   `NPM_MAILBOX_EMAIL` / `NPM_MAILBOX_PASSWORD` → Bearer, then poll
   `GET /messages` → `GET /messages/{id}` for the npm code.
3. Avatar → Account → **Access Tokens** → Generate New Token → **Granular** →
   Read+Write on packages, scopes `verixiaapps` + `verixia` orgs → tick
   **Bypass two-factor authentication** → save the `npm_…` value back into
   `NPM_VERIXIAAPPS_PUBLISH_TOKEN`.

## Org secrets (names — values are never in the repo)

| Secret | Purpose |
|---|---|
| `NPM_VERIXIAAPPS_PUBLISH_TOKEN` | automation token for `npm publish` |
| `NPM_ACCOUNT_PASSWORD` | npmjs.com `verixiaappstest` login (token re-mints) |
| `NPM_MAILBOX_EMAIL` | mail.tm address = the account's email (OTP delivery) |
| `NPM_MAILBOX_PASSWORD` | mail.tm login — read OTPs via the mail.tm API |

## Related surfaces

- GitHub Packages mirror: README documents the `@verixiaapps:registry` +
  `read:packages` path — optional, npmjs is primary.
- The plugin's paid calls settle through HostDeFi's x402 lane on Base — see
  scam-check-api `x402gate.js`; the plugin repo only holds the buyer side.
