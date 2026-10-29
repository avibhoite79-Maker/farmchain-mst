const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FarmChain", () => {
  let fc, admin, farmer, transporter, retailer, stranger;
  const price = ethers.parseEther("1");

  beforeEach(async () => {
    [admin, farmer, transporter, retailer, stranger] = await ethers.getSigners();
    fc = await (await ethers.getContractFactory("FarmChain")).deploy();
    await fc.registerParticipant(farmer.address, await fc.FARMER_ROLE());
    await fc.registerParticipant(transporter.address, await fc.TRANSPORTER_ROLE());
    await fc.registerParticipant(retailer.address, await fc.RETAILER_ROLE());
  });

  const make = () => fc.connect(farmer).createBatch("Tomato", 100, "Pune, MH", price);

  it("farmer creates a batch", async () => {
    await make();
    const b = await fc.getBatch(1);
    expect(b.cropName).to.equal("Tomato");
    expect(b.status).to.equal(0n);
    expect(await fc.batchCount()).to.equal(1n);
    expect((await fc.getHistory(1)).length).to.equal(1);
  });

  it("blocks non-farmers from creating batches", async () => {
    await expect(
      fc.connect(stranger).createBatch("Rice", 5, "X", price)
    ).to.be.revertedWithCustomError(fc, "AccessControlUnauthorizedAccount");
  });

  it("only admin can register participants", async () => {
    await expect(
      fc.connect(stranger).registerParticipant(stranger.address, await fc.FARMER_ROLE())
    ).to.be.revertedWithCustomError(fc, "AccessControlUnauthorizedAccount");
  });

  it("rejects skipping a status step", async () => {
    await make();
    await expect(fc.connect(transporter).updateStatus(1, 2, "skip")).to.be.revertedWith(
      "Invalid status step"
    );
  });

  it("rejects wrong order amount", async () => {
    await make();
    await expect(
      fc.connect(retailer).placeOrder(1, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Send the exact price");
  });

  it("full flow: order -> transport -> confirm -> farmer paid", async () => {
    await make();
    await fc.connect(retailer).placeOrder(1, { value: price });
    await fc.connect(transporter).updateStatus(1, 1, "Picked up");
    await fc.connect(transporter).updateStatus(1, 2, "Delivered to shop");

    await expect(fc.connect(retailer).confirmReceipt(1, "All good")).to.changeEtherBalance(
      farmer,
      price
    );

    const b = await fc.getBatch(1);
    expect(b.status).to.equal(3n);
    expect(b.paid).to.equal(true);
    expect((await fc.getHistory(1)).length).to.equal(4);
  });

  it("cannot confirm before delivery", async () => {
    await make();
    await fc.connect(retailer).placeOrder(1, { value: price });
    await expect(fc.connect(retailer).confirmReceipt(1, "")).to.be.revertedWith("Not delivered yet");
  });
});
