// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FarmChain - farm-to-customer traceability with escrow payments
/// @notice Farmer creates a batch -> Retailer orders (pays into escrow)
///         -> Transporter updates status -> Retailer confirms -> Farmer is paid.
contract FarmChain is AccessControl, ReentrancyGuard {
    // ---- Roles (admin = DEFAULT_ADMIN_ROLE = whoever deploys) ----
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    enum Status { Harvested, InTransit, Delivered, Sold }

    struct Batch {
        uint256 id;
        string cropName;
        uint256 quantity;      // e.g. kg
        string origin;         // farm / village / district
        uint256 harvestDate;   // unix timestamp
        uint256 price;         // in wei (ETH or MATIC)
        address farmer;
        address currentOwner;
        address retailer;      // set when an order is placed
        uint256 escrow;        // money held until delivery is confirmed
        bool paid;
        Status status;
    }

    struct Update {
        Status status;
        address by;
        string note;
        uint256 timestamp;
    }

    uint256 public batchCount;
    mapping(uint256 => Batch) private batches;
    mapping(uint256 => Update[]) private history;

    event BatchCreated(uint256 indexed id, address indexed farmer, string cropName);
    event StatusUpdated(uint256 indexed id, Status status, address indexed by);
    event OrderPlaced(uint256 indexed id, address indexed retailer, uint256 amount);
    event PaymentReleased(uint256 indexed id, address indexed farmer, uint256 amount);

    modifier exists(uint256 id) {
        require(id > 0 && id <= batchCount, "Batch does not exist");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ---------------- Admin ----------------

    /// @notice Admin gives a wallet one of the three roles.
    function registerParticipant(address account, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            role == FARMER_ROLE || role == TRANSPORTER_ROLE || role == RETAILER_ROLE,
            "Invalid role"
        );
        _grantRole(role, account);
    }

    // ---------------- Farmer ----------------

    function createBatch(
        string calldata cropName,
        uint256 quantity,
        string calldata origin,
        uint256 price
    ) external onlyRole(FARMER_ROLE) returns (uint256 id) {
        require(bytes(cropName).length > 0, "Crop name required");
        require(quantity > 0, "Quantity must be > 0");

        id = ++batchCount;
        Batch storage b = batches[id];
        b.id = id;
        b.cropName = cropName;
        b.quantity = quantity;
        b.origin = origin;
        b.harvestDate = block.timestamp;
        b.price = price;
        b.farmer = msg.sender;
        b.currentOwner = msg.sender;
        b.status = Status.Harvested;

        history[id].push(Update(Status.Harvested, msg.sender, "Harvested and listed", block.timestamp));
        emit BatchCreated(id, msg.sender, cropName);
    }

    // ---------------- Retailer: order ----------------

    /// @notice Retailer pays the exact price into escrow.
    function placeOrder(uint256 id) external payable onlyRole(RETAILER_ROLE) exists(id) {
        Batch storage b = batches[id];
        require(b.retailer == address(0), "Already ordered");
        require(msg.value == b.price, "Send the exact price");

        b.retailer = msg.sender;
        b.escrow = msg.value;
        emit OrderPlaced(id, msg.sender, msg.value);
    }

    // ---------------- Transporter ----------------

    /// @notice Move the batch one step forward: Harvested -> InTransit -> Delivered.
    function updateStatus(uint256 id, Status newStatus, string calldata note)
        external
        onlyRole(TRANSPORTER_ROLE)
        exists(id)
    {
        Batch storage b = batches[id];
        require(
            (b.status == Status.Harvested && newStatus == Status.InTransit) ||
            (b.status == Status.InTransit && newStatus == Status.Delivered),
            "Invalid status step"
        );

        b.status = newStatus;
        b.currentOwner = msg.sender;
        history[id].push(Update(newStatus, msg.sender, note, block.timestamp));
        emit StatusUpdated(id, newStatus, msg.sender);
    }

    // ---------------- Retailer: confirm + pay farmer ----------------

    function confirmReceipt(uint256 id, string calldata note)
        external
        onlyRole(RETAILER_ROLE)
        exists(id)
        nonReentrant
    {
        Batch storage b = batches[id];
        require(b.retailer == msg.sender, "Not your order");
        require(b.status == Status.Delivered, "Not delivered yet");

        // Effects first, then send money (safe pattern)
        uint256 amount = b.escrow;
        b.escrow = 0;
        b.paid = true;
        b.status = Status.Sold;
        b.currentOwner = msg.sender;
        history[id].push(Update(Status.Sold, msg.sender, note, block.timestamp));
        emit StatusUpdated(id, Status.Sold, msg.sender);

        (bool ok, ) = payable(b.farmer).call{value: amount}("");
        require(ok, "Payment failed");
        emit PaymentReleased(id, b.farmer, amount);
    }

    // ---------------- Public reads (customers) ----------------

    function getBatch(uint256 id) external view exists(id) returns (Batch memory) {
        return batches[id];
    }

    function getHistory(uint256 id) external view exists(id) returns (Update[] memory) {
        return history[id];
    }
}
