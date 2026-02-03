// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Treasury
 * @notice Treasury contract for Sovereign Submolts
 * @dev Holds funds and executes approved governance proposals
 */
contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    // The submolt token address
    address public immutable submoltToken;

    // Governance contract (set after deployment)
    address public governance;

    // Events
    event FundsReceived(address indexed from, uint256 amount);
    event FundsTransferred(address indexed to, uint256 amount);
    event TokensTransferred(address indexed token, address indexed to, uint256 amount);
    event GovernanceSet(address indexed governance);

    constructor(address _submoltToken) Ownable(msg.sender) {
        submoltToken = _submoltToken;
    }

    /**
     * @notice Set the governance contract address
     * @param _governance Address of the governance contract
     */
    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "Invalid governance address");
        governance = _governance;
        emit GovernanceSet(_governance);
    }

    /**
     * @notice Execute a proposal action (only callable by governance)
     * @param target Target address for the call
     * @param value ETH value to send
     * @param data Calldata for the call
     */
    function executeProposal(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory) {
        require(msg.sender == governance, "Only governance");

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");

        return result;
    }

    /**
     * @notice Transfer native tokens (MON) from treasury
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferFunds(address to, uint256 amount) external {
        require(msg.sender == governance, "Only governance");
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsTransferred(to, amount);
    }

    /**
     * @notice Transfer ERC20 tokens from treasury
     * @param token Token address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferTokens(address token, address to, uint256 amount) external {
        require(msg.sender == governance, "Only governance");
        require(to != address(0), "Invalid recipient");

        IERC20(token).safeTransfer(to, amount);

        emit TokensTransferred(token, to, amount);
    }

    /**
     * @notice Get native token balance
     */
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get ERC20 token balance
     * @param token Token address
     */
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get submolt token balance
     */
    function submoltTokenBalance() external view returns (uint256) {
        return IERC20(submoltToken).balanceOf(address(this));
    }

    // Receive native tokens
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
