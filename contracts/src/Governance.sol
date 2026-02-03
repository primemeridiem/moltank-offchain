// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "./Treasury.sol";

/**
 * @title Governance
 * @notice Simple governance contract for Sovereign Submolts
 * @dev Token-weighted voting on treasury proposals
 */
contract Governance {
    // Voting token
    ERC20Votes public immutable token;

    // Treasury contract
    Treasury public immutable treasury;

    // Submolt identifier
    string public submoltId;

    // Voting period in seconds (3 days default)
    uint256 public constant VOTING_PERIOD = 3 days;

    // Voting delay before voting starts (1 day)
    uint256 public constant VOTING_DELAY = 1 days;

    // Quorum percentage (4%)
    uint256 public constant QUORUM_PERCENTAGE = 4;

    // Proposal threshold (1% of total supply)
    uint256 public constant PROPOSAL_THRESHOLD_PERCENTAGE = 1;

    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Executed
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }

    // Proposal counter
    uint256 public proposalCount;

    // Mapping from proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    constructor(
        address _token,
        address _treasury,
        string memory _submoltId
    ) {
        token = ERC20Votes(_token);
        treasury = Treasury(payable(_treasury));
        submoltId = _submoltId;
    }

    /**
     * @notice Create a new proposal
     * @param title Short title for the proposal
     * @param description Detailed description
     * @param targets Target addresses for execution
     * @param values ETH values for each call
     * @param calldatas Calldata for each call
     */
    function propose(
        string calldata title,
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external returns (uint256) {
        require(
            token.getVotes(msg.sender) >= proposalThreshold(),
            "Insufficient voting power to propose"
        );
        require(targets.length == values.length, "Length mismatch");
        require(targets.length == calldatas.length, "Length mismatch");
        require(targets.length > 0, "Empty proposal");

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startTime = block.timestamp + VOTING_DELAY;
        proposal.endTime = proposal.startTime + VOTING_PERIOD;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposal.startTime,
            proposal.endTime
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId The proposal ID
     * @param support True for yes, false for no
     */
    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];

        require(state(proposalId) == ProposalState.Active, "Voting not active");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = token.getPastVotes(msg.sender, proposal.startTime - 1);
        require(weight > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    /**
     * @notice Execute a successful proposal
     * @param proposalId The proposal ID
     */
    function execute(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            treasury.executeProposal(
                proposal.targets[i],
                proposal.values[i],
                proposal.calldatas[i]
            );
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (only proposer, before voting starts)
     * @param proposalId The proposal ID
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        require(msg.sender == proposal.proposer, "Only proposer");
        require(state(proposalId) == ProposalState.Pending, "Cannot cancel");

        proposal.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    /**
     * @notice Get the current state of a proposal
     * @param proposalId The proposal ID
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }

        // Voting ended - check results
        if (proposal.forVotes > proposal.againstVotes && proposal.forVotes >= quorum()) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /**
     * @notice Get the quorum (minimum votes needed)
     */
    function quorum() public view returns (uint256) {
        return (token.totalSupply() * QUORUM_PERCENTAGE) / 100;
    }

    /**
     * @notice Get the proposal threshold (minimum tokens to propose)
     */
    function proposalThreshold() public view returns (uint256) {
        return (token.totalSupply() * PROPOSAL_THRESHOLD_PERCENTAGE) / 100;
    }

    /**
     * @notice Check if an address has voted on a proposal
     * @param proposalId The proposal ID
     * @param voter The voter address
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    /**
     * @notice Get proposal details
     * @param proposalId The proposal ID
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            string memory title,
            string memory description,
            address proposer,
            uint256 forVotes,
            uint256 againstVotes,
            ProposalState proposalState,
            uint256 endTime
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.forVotes,
            proposal.againstVotes,
            state(proposalId),
            proposal.endTime
        );
    }
}
