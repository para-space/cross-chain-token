import {
  advanceTimeAndBlock,
  deployFixture,
  MAX_UINT_AMOUNT,
  TestDeploymentEnv,
} from "./helper/utils";
import { parseEther } from "ethers";
import { ZEROADDRESS } from "../script/helpers/constants";
const hre = require("hardhat");
const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("XERC721 LockBox TEST", function () {
  it("ERC721 with ApeStaking strategy operation function as expected", async function () {
    const [owner, user] = await hre.ethers.getSigners();
    const testENV: TestDeploymentEnv = await loadFixture(deployFixture);

    await testENV.bayc.connect(user)["mint(uint256,address)"](2, user.address);

    await testENV.bayc
      .connect(user)
      .setApprovalForAll(await testENV.xBaycLockbox.getAddress(), true);

    await testENV.xBaycLockbox.connect(user).deposit([0, 1]);

    expect(await testENV.xBayc.balanceOf(user.address)).to.be.eq(2);

    expect(
      await testENV.bayc.balanceOf(await testENV.xBaycLockbox.getAddress())
    ).to.be.eq(2);
    await testENV.xBaycLockbox.connect(owner).strategyYield([0, 1]);
    expect(
      await testENV.bayc.balanceOf(await testENV.xBaycLockbox.getAddress())
    ).to.be.eq(0);
    await testENV.xBaycLockbox.connect(owner).strategyWithdraw([0, 1]);
    expect(
      await testENV.bayc.balanceOf(await testENV.xBaycLockbox.getAddress())
    ).to.be.eq(2);

    await testENV.xBayc
      .connect(user)
      .approve(await testENV.xBaycLockbox.getAddress(), 0);
    await testENV.xBayc
      .connect(user)
      .approve(await testENV.xBaycLockbox.getAddress(), 1);
    await testENV.xBaycLockbox.connect(user).withdraw([0, 1]);
    expect(
      await testENV.bayc.balanceOf(await testENV.xBaycLockbox.getAddress())
    ).to.be.eq(0);
    expect(await testENV.bayc.balanceOf(user.address)).to.be.eq(2);
  });

  it("can only be withdraw from lockbox by xerc721 owner", async function () {
    const [owner, user, other] = await hre.ethers.getSigners();
    const testENV: TestDeploymentEnv = await loadFixture(deployFixture);

    await testENV.bayc.connect(user)["mint(uint256,address)"](2, user.address);

    await testENV.bayc
      .connect(user)
      .setApprovalForAll(await testENV.xBaycLockbox.getAddress(), true);

    await testENV.xBaycLockbox.connect(user).deposit([0, 1]);

    await testENV.xBayc
      .connect(user)
      .setApprovalForAll(await testENV.xBaycLockbox.getAddress(), true);
    await expect(
      testENV.xBaycLockbox.connect(other).withdraw([0, 1])
    ).to.be.rejectedWith("IXERC721_NotTokenOwner()");
  });

  it("xerc721 bridge limit test", async function () {
    const [owner, user, other] = await hre.ethers.getSigners();
    const testENV: TestDeploymentEnv = await loadFixture(deployFixture);

    await expect(
      testENV.xBayc.connect(user).setLimits(user.address, 24, 24)
    ).to.be.rejectedWith("Ownable: caller is not the owner");

    await testENV.xBayc.connect(owner).setLimits(user.address, 24, 24);

    let limitInfo = await testENV.xBayc.bridges(user.address);
    expect(limitInfo.minterParams.ratePerHour).to.be.eq(1);
    expect(limitInfo.minterParams.maxLimit).to.be.eq(24);
    expect(limitInfo.minterParams.currentLimit).to.be.eq(24);
    expect(limitInfo.burnerParams.ratePerHour).to.be.eq(1);
    expect(limitInfo.burnerParams.maxLimit).to.be.eq(24);
    expect(limitInfo.burnerParams.currentLimit).to.be.eq(24);

    //mint 12 NFT
    await expect(
      testENV.xBayc
        .connect(other)
        .mint(other.address, Array.from(Array(12).keys()))
    ).to.be.rejectedWith("IXERC721_NotHighEnoughLimits()");

    await testENV.xBayc
      .connect(user)
      .mint(user.address, Array.from(Array(12).keys()));
    expect(await testENV.xBayc.balanceOf(user.address)).to.be.eq(12);

    //check limit
    limitInfo = await testENV.xBayc.bridges(user.address);
    expect(limitInfo.minterParams.ratePerHour).to.be.eq(1);
    expect(limitInfo.minterParams.maxLimit).to.be.eq(24);
    expect(limitInfo.minterParams.currentLimit).to.be.eq(12);
    expect(limitInfo.burnerParams.ratePerHour).to.be.eq(1);
    expect(limitInfo.burnerParams.maxLimit).to.be.eq(24);
    expect(limitInfo.burnerParams.currentLimit).to.be.eq(24);

    const mintIds = Array.from(Array(36).keys()).slice(12);
    await expect(
      testENV.xBayc.connect(user).mint(user.address, mintIds)
    ).to.be.rejectedWith("IXERC721_NotHighEnoughLimits()");

    await advanceTimeAndBlock(3600);
    expect(await testENV.xBayc.mintingCurrentLimitOf(user.address)).to.be.eq(
      13
    );

    await advanceTimeAndBlock(3600 * 11);
    expect(await testENV.xBayc.mintingCurrentLimitOf(user.address)).to.be.eq(
      24
    );

    await testENV.xBayc.connect(user).mint(user.address, mintIds);
    expect(await testENV.xBayc.balanceOf(user.address)).to.be.eq(36);
    expect(await testENV.xBayc.mintingCurrentLimitOf(user.address)).to.be.eq(0);

    //burn 12 NFT
    await expect(
      testENV.xBayc
        .connect(other)
        .burn(other.address, Array.from(Array(12).keys()))
    ).to.be.rejectedWith("IXERC721_NotHighEnoughLimits()");

    await testENV.xBayc
      .connect(user)
      .burn(user.address, Array.from(Array(12).keys()));
    expect(await testENV.xBayc.balanceOf(user.address)).to.be.eq(24);

    //check limit
    limitInfo = await testENV.xBayc.bridges(user.address);
    expect(limitInfo.burnerParams.ratePerHour).to.be.eq(1);
    expect(limitInfo.burnerParams.maxLimit).to.be.eq(24);
    expect(limitInfo.burnerParams.currentLimit).to.be.eq(12);

    await expect(
      testENV.xBayc.connect(user).burn(user.address, mintIds)
    ).to.be.rejectedWith("IXERC721_NotHighEnoughLimits()");

    await advanceTimeAndBlock(3600);
    expect(await testENV.xBayc.burningCurrentLimitOf(user.address)).to.be.eq(
      13
    );

    await advanceTimeAndBlock(3600 * 11);
    expect(await testENV.xBayc.burningCurrentLimitOf(user.address)).to.be.eq(
      24
    );

    await testENV.xBayc.connect(user).burn(user.address, mintIds);
    expect(await testENV.xBayc.balanceOf(user.address)).to.be.eq(0);

    expect(await testENV.xBayc.burningCurrentLimitOf(user.address)).to.be.eq(0);
  });

  it("erc721 lockbox owner privilege operation", async function () {
    const [, user] = await hre.ethers.getSigners();
    const testENV: TestDeploymentEnv = await loadFixture(deployFixture);

    await expect(
      testENV.xBaycLockbox.connect(user).setStrategy(ZEROADDRESS)
    ).to.be.rejectedWith("Ownable: caller is not the owner");

    await expect(
      testENV.xBaycLockbox.connect(user).strategyYield([])
    ).to.be.rejectedWith("Ownable: caller is not the owner");

    await expect(
      testENV.xBaycLockbox.connect(user).strategyWithdraw([])
    ).to.be.rejectedWith("Ownable: caller is not the owner");

    await expect(
      testENV.xBaycLockbox
        .connect(user)
        .rescueERC721(ZEROADDRESS, ZEROADDRESS, [])
    ).to.be.rejectedWith("Ownable: caller is not the owner");
  });
});
