// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArenaTicketNFT is ERC721URIStorage, Ownable {
    struct TicketData {
        string tournamentId;
        string tournamentName;
        uint64 eventDate;
        string ticketType;
        bool valid;
        bool used;
        uint64 usedAt;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => TicketData) private _tickets;

    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        string tournamentId,
        string ticketType,
        string metadataURI
    );

    event TicketMarkedUsed(uint256 indexed tokenId, uint64 usedAt);

    constructor(address initialOwner) ERC721("ArenaChain Ticket", "ARCTKT") Ownable(initialOwner) {}

    function mintTicket(
        address to,
        string calldata metadataURI,
        string calldata tournamentId,
        string calldata tournamentName,
        uint64 eventDate,
        string calldata ticketType
    ) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");
        require(bytes(metadataURI).length > 0, "metadataURI required");
        require(bytes(tournamentId).length > 0, "tournamentId required");
        require(bytes(ticketType).length > 0, "ticketType required");

        tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        _tickets[tokenId] = TicketData({
            tournamentId: tournamentId,
            tournamentName: tournamentName,
            eventDate: eventDate,
            ticketType: ticketType,
            valid: true,
            used: false,
            usedAt: 0
        });

        emit TicketMinted(tokenId, to, tournamentId, ticketType, metadataURI);
    }

    function markTicketAsUsed(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        TicketData storage ticket = _tickets[tokenId];
        require(ticket.valid, "Ticket invalid");
        require(!ticket.used, "Ticket already used");

        ticket.used = true;
        ticket.valid = false;
        ticket.usedAt = uint64(block.timestamp);

        emit TicketMarkedUsed(tokenId, ticket.usedAt);
    }

    function invalidateTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _tickets[tokenId].valid = false;
    }

    function getTicketData(uint256 tokenId) external view returns (TicketData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tickets[tokenId];
    }

    function isTicketUsable(uint256 tokenId, address claimant) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        TicketData memory ticket = _tickets[tokenId];
        if (ownerOf(tokenId) != claimant) return false;
        if (!ticket.valid || ticket.used) return false;
        return true;
    }
}
