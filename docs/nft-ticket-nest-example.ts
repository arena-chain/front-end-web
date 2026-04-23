/**
 * Exemple NestJS (TypeScript) pour:
 * - creation tournoi
 * - generation X tickets NFT
 * - mint admin-only via smart contract
 * - persistance tokenId / wallet / tournoi
 */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { ethers } from 'ethers';

type AdminUser = { id: string; role: 'ADMIN' | 'PLAYER' };
type Tournament = { id: string; name: string; startsAt: string };

interface MintTicketInput {
    to: string;
    metadataURI: string;
    tournamentId: string;
    tournamentName: string;
    eventDateUnix: number;
    ticketType: 'NORMAL' | 'VIP';
}

interface TicketEntity {
    id: string;
    tournamentId: string;
    tokenId: string;
    contractAddress: string;
    metadataURI: string;
    recipientWallet?: string;
    status: 'VALID' | 'USED' | 'CANCELLED';
}

@Injectable()
export class AdminNftTicketService {
    private readonly provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
    private readonly signer = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY || '', this.provider);
    private readonly contract = new ethers.Contract(
        process.env.TICKET_NFT_CONTRACT_ADDRESS || '',
        [
            'function mintTicket(address to,string metadataURI,string tournamentId,string tournamentName,uint64 eventDate,string ticketType) external returns (uint256)',
            'event TicketMinted(uint256 indexed tokenId,address indexed to,string tournamentId,string ticketType,string metadataURI)'
        ],
        this.signer
    );

    // Mock repository methods (replace with your DB repository/services)
    private async saveTicket(ticket: TicketEntity): Promise<void> {
        void ticket;
    }
    private async createMetadataOnBackend(input: MintTicketInput): Promise<string> {
        // Option A: store JSON in backend and return URL
        // Option B: upload JSON to IPFS and return ipfs://...
        return `https://api.arenachain.app/metadata/${input.tournamentId}/${Date.now()}.json`;
    }

    async generateTournamentTickets(
        admin: AdminUser,
        tournament: Tournament,
        quantity: number,
        ticketType: 'NORMAL' | 'VIP',
        recipientWallets?: string[]
    ) {
        if (admin.role !== 'ADMIN') {
            throw new ForbiddenException('Only admin can mint NFT tickets');
        }
        if (quantity <= 0) {
            return [];
        }

        const recipients = recipientWallets?.length
            ? recipientWallets
            : Array.from({ length: quantity }, () => this.signer.address); // stockes dans wallet admin si non assigne

        const created: Array<{ tokenId: string; txHash: string; recipient: string }> = [];
        for (let i = 0; i < quantity; i++) {
            const to = recipients[i] || this.signer.address;
            const input: MintTicketInput = {
                to,
                metadataURI: '',
                tournamentId: tournament.id,
                tournamentName: tournament.name,
                eventDateUnix: Math.floor(new Date(tournament.startsAt).getTime() / 1000),
                ticketType
            };
            const metadataURI = await this.createMetadataOnBackend(input);

            const tx = await this.contract.mintTicket(
                to,
                metadataURI,
                tournament.id,
                tournament.name,
                input.eventDateUnix,
                ticketType
            );
            const receipt = await tx.wait();

            const mintedEvent = receipt?.logs
                ?.map((log: any) => {
                    try {
                        return this.contract.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((parsed: any) => parsed?.name === 'TicketMinted');

            const tokenId = mintedEvent?.args?.tokenId?.toString() || '0';
            await this.saveTicket({
                id: crypto.randomUUID(),
                tournamentId: tournament.id,
                tokenId,
                contractAddress: await this.contract.getAddress(),
                metadataURI,
                recipientWallet: to,
                status: 'VALID'
            });

            created.push({
                tokenId,
                txHash: receipt?.hash || '',
                recipient: to
            });
        }
        return created;
    }
}
