const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Crowdfunding", function () {
  let Crowdfunding, crowdfunding;
  let owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfunding = await Crowdfunding.deploy();
    await crowdfunding.waitForDeployment();
  });

  it("inicijalno campaignCount treba biti 0", async () => {
    expect(await crowdfunding.campaignCount()).to.equal(0);
  });

  it("može kreirati kampanju", async () => {
    const tx = await crowdfunding.createCampaign(
      "Test",
      ethers.parseEther("1"),
      60
    );

    await expect(tx)
      .to.emit(crowdfunding, "CampaignCreated")
      .withArgs(
        1,
        owner.address,
        ethers.parseEther("1"),
        anyValue       
      );

    const camp = await crowdfunding.campaigns(1);
    expect(camp.deadline).to.be.gt(0);
  });

  it("može pledgati prije roka", async () => {
    await crowdfunding.createCampaign(
      "Test",
      ethers.parseEther("2"),
      60
    );
    await expect(
      crowdfunding.connect(addr1).pledge(1, {
        value: ethers.parseEther("0.5"),
      })
    )
      .to.emit(crowdfunding, "Pledged")
      .withArgs(1, addr1.address, ethers.parseEther("0.5"));

    const camp = await crowdfunding.campaigns(1);
    expect(camp.pledged).to.equal(ethers.parseEther("0.5"));
    expect(await crowdfunding.pledges(1, addr1.address)).to.equal(
      ethers.parseEther("0.5")
    );
  });

  it("ne dozvoljava pledg nakon isteka roka", async () => {
    await crowdfunding.createCampaign(
      "Test",
      ethers.parseEther("1"),
      1
    );
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    await expect(
      crowdfunding.connect(addr1).pledge(1, {
        value: ethers.parseEther("0.1"),
      })
    ).to.be.revertedWith("Campaign ended");
  });

  it("vlasnik može withdraw nakon isteka ako je goal dosegnut", async () => {
    await crowdfunding.createCampaign(
      "Test",
      ethers.parseEther("1"),
      3
    );
    await crowdfunding
      .connect(addr1)
      .pledge(1, { value: ethers.parseEther("0.6") });
    await crowdfunding
      .connect(addr2)
      .pledge(1, { value: ethers.parseEther("0.6") });

    await ethers.provider.send("evm_increaseTime", [5]);
    await ethers.provider.send("evm_mine");

    await expect(crowdfunding.withdraw(1))
      .to.emit(crowdfunding, "Withdrawn")
      .withArgs(1, owner.address, ethers.parseEther("1.2"));
  });

  it("refund ako goal nije dosegnut", async () => {
    await crowdfunding.createCampaign(
      "Test",
      ethers.parseEther("2"),
      2
    );
    await crowdfunding
      .connect(addr1)
      .pledge(1, { value: ethers.parseEther("0.5") });

    await ethers.provider.send("evm_increaseTime", [3]);
    await ethers.provider.send("evm_mine");

    await expect(crowdfunding.connect(addr1).refund(1))
      .to.emit(crowdfunding, "Refunded")
      .withArgs(1, addr1.address, ethers.parseEther("0.5"));

    expect(await crowdfunding.pledges(1, addr1.address)).to.equal(0);
  });

  it("ne dozvoljava withdraw ako caller nije owner", async () => {
    await crowdfunding.createCampaign(
      "Test",
      ethers.parseEther("1"),
      2
    );
    await crowdfunding
      .connect(addr1)
      .pledge(1, { value: ethers.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [3]);
    await ethers.provider.send("evm_mine");

    await expect(
      crowdfunding.connect(addr1).withdraw(1)
    ).to.be.revertedWith("Not owner");
  });
});