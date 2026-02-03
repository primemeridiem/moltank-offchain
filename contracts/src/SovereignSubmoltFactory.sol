// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SubmoltToken.sol";
import "./Treasury.sol";
import "./Governance.sol";

/**
 * @title SovereignSubmoltFactory
 * @notice Factory contract for creating Sovereign Submolts on Monad
 * @dev Creates token, treasury, and governance contracts for each submolt
 */
contract SovereignSubmoltFactory {
    // Minimum karma required to create a Sovereign Submolt
    uint256 public constant MIN_KARMA_TO_CREATE = 10;

    // Maximum creator allocation (20%)
    uint256 public constant MAX_CREATOR_ALLOCATION = 20;

    struct SovereignSubmolt {
        string submoltId;
        address tokenAddress;
        address treasuryAddress;
        address governanceAddress;
        address creator;
        uint256 earlyAccessKarma;
        uint256 gatedChannelKarma;
        uint256 creatorAllocation;
        bool isActive;
        uint256 createdAt;
    }

    // Mapping from submolt ID hash to Sovereign Submolt
    mapping(bytes32 => SovereignSubmolt) public submolts;

    // Array of all submolt IDs for enumeration
    bytes32[] public submoltIds;

    // Events
    event SovereignSubmoltCreated(
        string indexed submoltId,
        address tokenAddress,
        address treasuryAddress,
        address governanceAddress,
        address indexed creator
    );

    /**
     * @notice Create a new Sovereign Submolt
     * @param submoltId The Moltbook submolt identifier
     * @param tokenName Name for the submolt token
     * @param tokenSymbol Symbol for the submolt token
     * @param earlyAccessKarma Karma threshold for early token access
     * @param gatedChannelKarma Karma threshold for gated channel access
     * @param creatorAllocation Percentage of tokens allocated to creator (max 20%)
     */
    function createSovereignSubmolt(
        string calldata submoltId,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 earlyAccessKarma,
        uint256 gatedChannelKarma,
        uint256 creatorAllocation
    ) external returns (address tokenAddress, address treasuryAddress, address governanceAddress) {
        bytes32 submoltIdHash = keccak256(bytes(submoltId));

        // Check submolt doesn't already exist
        require(!submolts[submoltIdHash].isActive, "Submolt already exists");

        // Check creator allocation is within limits
        require(creatorAllocation <= MAX_CREATOR_ALLOCATION, "Creator allocation too high");

        // Deploy token contract
        SubmoltToken token = new SubmoltToken(
            tokenName,
            tokenSymbol,
            msg.sender,
            creatorAllocation
        );
        tokenAddress = address(token);

        // Deploy treasury contract
        Treasury treasury = new Treasury(tokenAddress);
        treasuryAddress = address(treasury);

        // Deploy governance contract
        Governance governance = new Governance(
            tokenAddress,
            treasuryAddress,
            submoltId
        );
        governanceAddress = address(governance);

        // Store submolt data
        submolts[submoltIdHash] = SovereignSubmolt({
            submoltId: submoltId,
            tokenAddress: tokenAddress,
            treasuryAddress: treasuryAddress,
            governanceAddress: governanceAddress,
            creator: msg.sender,
            earlyAccessKarma: earlyAccessKarma,
            gatedChannelKarma: gatedChannelKarma,
            creatorAllocation: creatorAllocation,
            isActive: true,
            createdAt: block.timestamp
        });

        submoltIds.push(submoltIdHash);

        emit SovereignSubmoltCreated(
            submoltId,
            tokenAddress,
            treasuryAddress,
            governanceAddress,
            msg.sender
        );

        return (tokenAddress, treasuryAddress, governanceAddress);
    }

    /**
     * @notice Get Sovereign Submolt details by ID
     * @param submoltId The Moltbook submolt identifier
     */
    function getSovereignSubmolt(string calldata submoltId)
        external
        view
        returns (SovereignSubmolt memory)
    {
        bytes32 submoltIdHash = keccak256(bytes(submoltId));
        return submolts[submoltIdHash];
    }

    /**
     * @notice Get total number of Sovereign Submolts created
     */
    function getSubmoltCount() external view returns (uint256) {
        return submoltIds.length;
    }

    /**
     * @notice Check if a submolt exists
     * @param submoltId The Moltbook submolt identifier
     */
    function submoltExists(string calldata submoltId) external view returns (bool) {
        bytes32 submoltIdHash = keccak256(bytes(submoltId));
        return submolts[submoltIdHash].isActive;
    }
}
