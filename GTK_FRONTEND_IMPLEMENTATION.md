# GTK (GameToken) — frontend implementation

This guide wires your UI to the backend so a logged-in user can see **how much GTK/VEX** they hold. Auth stays **JWT**. Each player gets an **in-app wallet**: the API stores an EVM address on the user’s **inventory** document (created automatically on first `GET …/me` by default). There is **no MetaMask linking** in the main player flow.

## Prerequisites

1. Backend running with:
   - `GAME_TOKEN_CONTRACT_ADDRESS` = deployed `GameToken` address  
   - `RPC_URL` **or** `ALCHEMY_API_KEY` + `ALCHEMY_NETWORK` (same chain as the contract)
2. For **local Anvil**: keep `anvil` running, use `RPC_URL=http://127.0.0.1:8545`, chain id **31337** (from `GET …/config`).

## API base

All routes below are under your API origin, e.g. `http://localhost:3000`, with global prefix **`/api`**.

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/currency/game-token/config` | None |
| `GET` | `/api/currency/game-token/me` | Bearer JWT |

Headers for protected routes:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Optional env on the API:

- **`GTK_AUTO_PROVISION_APP_WALLET`** — default `true`: first authenticated `GET /currency/game-token/me` creates a random `walletAddress` on inventory if missing.
- **`GTK_CUSTODIAL_INSECURE_STORE`** — `true` only on trusted dev: also stores `metadata.custodialPrivateKey` (never enable in production).

---

## Step 1 — Load token metadata (labels + network)

Call once when opening the wallet / currency screen (or on app bootstrap).

**`GET /api/currency/game-token/config`**

Example response:

```json
{
  "contractAddress": "0x5FbDb2315678afecb367f032d93F642f64180aa3",
  "name": "GameToken",
  "symbol": "GTK",
  "decimals": 18,
  "chainId": 31337
}
```

Use **`symbol`** / **`decimals`** in the UI. Use **`chainId`** if you ever need to match the chain the contract lives on (e.g. Anvil **31337**).

If this returns **503**, the server is missing GTK env vars — fix `.env` before building UI states that depend on balance.

---

## Step 2 — Show balance (“what they have”)

**`GET /api/currency/game-token/me`**

Creates the in-app **`walletAddress`** on first call when auto-provision is enabled, then returns the on-chain **ERC-20 balance** for that address (server reads RPC).

Example when no wallet could be created yet (e.g. auto-provision disabled):

```json
{
  "linked": false,
  "walletAddress": null,
  "balanceFormatted": "0.0",
  "hint": "Enable GTK_AUTO_PROVISION_APP_WALLET (default) so the API can create your in-app wallet address."
}
```

Example when provisioned and balance read OK:

```json
{
  "linked": true,
  "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "appManagedWallet": true,
  "balanceRaw": "1000000000000000000000000",
  "balanceFormatted": "1000000.0",
  "symbol": "GTK",
  "decimals": 18,
  "chainId": 31337
}
```

Display **`balanceFormatted`** + display symbol from your branding helpers. You may show a shortened **`walletAddress`** as read-only (“Arena wallet”).

Example (fetch):

```javascript
const res = await fetch(`${API}/currency/game-token/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();

if (!data.walletAddress) {
  // show misconfiguration / retry
} else {
  // show `${data.balanceFormatted} ${data.symbol}`
}
```

---

## Suggested UI flow

1. User opens “Currency” / “Wallet” screen.
2. `GET …/config` → if 503, show maintenance / misconfiguration message.
3. With JWT → `GET …/me` → render balance (and optional short address). No wallet extension required for this flow.

Refresh balance after purchases or polling if you need live-ish updates.

---

## Anvil / local testing tips

- The server’s minter wallet (**`WALLET_PRIVATE_KEY`**) mints GTK to player addresses returned by `/me`.
- To fund a player’s in-app address, use test credit / simulated purchase endpoints or mint from your deployer on Anvil.
- Contract address may change if you redeploy; update `GAME_TOKEN_CONTRACT_ADDRESS`.

---

## Security reminders

- Do **not** log or expose custodial private keys from the API.
- `GET …/config` is public by design (contract addresses are already public on-chain).
