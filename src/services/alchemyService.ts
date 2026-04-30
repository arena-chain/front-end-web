import { getBlockchainRpcUrl } from '../lib/apiBase';

/**
 * Alchemy Service - Directly interacts with Polygon via the Alchemy JSON-RPC API.
 * This is used for client-side blockchain data fetching.
 */
export const alchemyService = {
    /**
     * Fetch NFT metadata using the Alchemy NFT API
     * @param contractAddress - The NFT contract address
     * @param tokenId - The specific token ID
     * @returns Metadata including image, name, and attributes
     */
    async getNftMetadata(contractAddress: string, tokenId: string) {
        const rpcUrl = getBlockchainRpcUrl();
        // Extract API key from the URL
        const apiKey = rpcUrl.split('/').pop();
        
        // Alchemy NFT API uses a different base URL than the RPC URL
        // Example: https://polygon-mainnet.g.alchemy.com/nft/v3/{apiKey}/getNFTMetadata
        const nftApiUrl = `https://polygon-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=false`;

        try {
            const response = await fetch(nftApiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Alchemy NFT metadata fetch failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching NFT metadata via Alchemy:', error);
            throw error;
        }
    },

    /**
     * Fetch all NFTs owned by a wallet
     * @param walletAddress - The owner's wallet address
     */
    async getNftsForOwner(walletAddress: string) {
        const rpcUrl = getBlockchainRpcUrl();
        const apiKey = rpcUrl.split('/').pop();
        const nftApiUrl = `https://polygon-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=100`;

        try {
            const response = await fetch(nftApiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Alchemy getNFTsForOwner failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching owner NFTs via Alchemy:', error);
            throw error;
        }
    }
};

export default alchemyService;
