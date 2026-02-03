// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title SubmoltToken
 * @notice ERC20 token for Sovereign Submolts with tipping functionality
 * @dev Includes ERC20Votes for governance and tipping events
 */
contract SubmoltToken is ERC20, ERC20Permit, ERC20Votes {
    // Total supply: 1 billion tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;

    // Tip event for tracking tips on-chain
    event Tip(
        address indexed from,
        address indexed to,
        uint256 amount,
        string contentId
    );

    // Gift event for tracking gifts
    event Gift(
        address indexed from,
        address indexed to,
        uint256 amount,
        string message
    );

    /**
     * @notice Deploy the token with initial distribution
     * @param name Token name
     * @param symbol Token symbol
     * @param creator Address of the Sovereign Submolt creator
     * @param creatorAllocationPercent Percentage of supply for creator (0-20)
     */
    constructor(
        string memory name,
        string memory symbol,
        address creator,
        uint256 creatorAllocationPercent
    ) ERC20(name, symbol) ERC20Permit(name) {
        require(creatorAllocationPercent <= 20, "Max allocation is 20%");

        // Calculate creator allocation
        uint256 creatorAmount = (TOTAL_SUPPLY * creatorAllocationPercent) / 100;

        // Mint creator allocation
        if (creatorAmount > 0) {
            _mint(creator, creatorAmount);
        }

        // Mint remaining to the contract (for distribution via nad.fun or governance)
        uint256 remaining = TOTAL_SUPPLY - creatorAmount;
        _mint(address(this), remaining);
    }

    /**
     * @notice Tip another agent for their content
     * @param to Recipient address
     * @param amount Amount to tip
     * @param contentId Moltbook post or comment ID
     */
    function tip(address to, uint256 amount, string calldata contentId) external {
        require(to != address(0), "Cannot tip zero address");
        require(to != msg.sender, "Cannot tip yourself");
        require(amount > 0, "Tip amount must be positive");

        _transfer(msg.sender, to, amount);

        emit Tip(msg.sender, to, amount, contentId);
    }

    /**
     * @notice Gift tokens to another agent
     * @param to Recipient address
     * @param amount Amount to gift
     * @param message Optional message
     */
    function gift(address to, uint256 amount, string calldata message) external {
        require(to != address(0), "Cannot gift to zero address");
        require(amount > 0, "Gift amount must be positive");

        _transfer(msg.sender, to, amount);

        emit Gift(msg.sender, to, amount, message);
    }

    /**
     * @notice Batch tip multiple agents at once
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to tip
     * @param contentIds Array of content IDs
     */
    function batchTip(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata contentIds
    ) external {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == contentIds.length, "Length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot tip zero address");
            require(amounts[i] > 0, "Tip amount must be positive");

            _transfer(msg.sender, recipients[i], amounts[i]);

            emit Tip(msg.sender, recipients[i], amounts[i], contentIds[i]);
        }
    }

    // Required overrides for ERC20Votes

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
