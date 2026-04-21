# NFT Tickets Admin Flow (ArenaChain MVP)

## Objectif
- Seul l'admin mint les tickets NFT.
- Chaque ticket est unique (ERC-721).
- Les tickets sont relies a un tournoi et peuvent etre assignes immediatement ou plus tard.

## Livrables inclus
- Smart contract: `blockchain/contracts/ArenaTicketNFT.sol`
- Hardhat config: `blockchain/hardhat.config.ts`
- Script deploy: `blockchain/scripts/deploy.ts`
- Exemple metadata JSON: `docs/nft-ticket-metadata.example.json`
- Exemple backend NestJS: `docs/nft-ticket-nest-example.ts`

## Contrat (ERC-721)
- `mintTicket(...)`: mint admin-only.
- `ownerOf(...)` / `balanceOf(...)`: herites de ERC721.
- `markTicketAsUsed(...)`: optionnel pour validation check-in.
- `isTicketUsable(...)`: verification ownership + validite.

## Deploiement rapide
1. Ouvrir `blockchain/.env.example` et copier vers `.env`
2. Completer:
   - `DEPLOYER_PRIVATE_KEY`
   - `POLYGON_AMOY_RPC_URL`
3. Installer et deployer:
   - `cd blockchain`
   - `npm install`
   - `npm run compile`
   - `npm run deploy:amoy`

## Integration backend (NestJS)
- Voir `docs/nft-ticket-nest-example.ts`
- Sequence:
  1) Creer tournoi (DB)
  2) Generer metadataURI (IPFS ou backend URL)
  3) Appeler `mintTicket(...)` pour X tickets
  4) Sauver `tokenId`, `contractAddress`, `wallet`, `tournamentId`, `status`

## Distribution
- Option A: mint direct vers wallet user.
- Option B: mint vers wallet admin, puis assignation ulterieure.

## Validation (check-in)
- QR code contient au minimum `contractAddress + tokenId`.
- Au scan:
  - verifier `ownerOf(tokenId)` = wallet declare
  - verifier ticket non utilise (`isTicketUsable` ou DB status)
  - marquer utilise via backend admin (`markTicketAsUsed`)
