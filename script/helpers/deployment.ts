import {eContractid, tEthereumAddress} from "../types";
import hre, { ethers } from "hardhat";
import {
  AaveStrategy,
  ERC20,
  ETHAaveStrategy,
  MintableERC20,
  MockAAVE,
  MockLido,
  MockWstETH,
  XERC20,
  XERC20Factory,
} from "../../typechain-types";
import { overrides } from "./networks";
import { storeDeployInfo } from "./utils";
import { ZEROADDRESS } from "./constants";

export const getERC20 = async (address: tEthereumAddress) => {
  const ERC20Factory = await ethers.getContractFactory("ERC20");
  return ERC20Factory.attach(address) as unknown as ERC20;
};

export const deployFactory = async () => {
  const XERC20FactoryFactory = await ethers.getContractFactory("XERC20Factory");
  const XERC20Factory = await XERC20FactoryFactory.deploy({
    ...overrides[hre.network.name],
  });
  await XERC20Factory.deploymentTransaction().wait(1);

  const factoryAddr = await XERC20Factory.getAddress();
  await storeDeployInfo("XERC20Factory", {
    address: factoryAddr,
    constructorArgs: [],
  });

  console.log("XERC20Factory deployed to:", factoryAddr);

  return XERC20FactoryFactory.attach(factoryAddr) as unknown as XERC20Factory;
};

export const deployXERC20 = async (
  factory: XERC20Factory,
  tokenName: string,
  tokenSymbol: string
) => {
  const xTokenName = `x${tokenName}`;
  const xTokenSymbol = `x${tokenSymbol}`;
  const deployTx = await factory.deployXERC20(
    xTokenName,
    xTokenSymbol,
    [],
    [],
    [],
    {
      ...overrides[hre.network.name],
    }
  );
  const xERC20Receipt = await deployTx.wait(1);
  const logLength = xERC20Receipt.logs.length;
  const xERC20Addr = `0x${xERC20Receipt.logs[logLength - 1].data.slice(26)}`;

  await storeDeployInfo(`${eContractid.XERC20}-${tokenSymbol}`, {
    address: xERC20Addr,
    constructorArgs: [xTokenName, xTokenSymbol, await factory.getAddress()],
  });

  console.log(`XERC20-${tokenSymbol} deployed to: ${xERC20Addr}`);

  return xERC20Addr;
};

export const deployLockbox = async (
  factory: XERC20Factory,
  xToken: string,
  token: string,
  tokenSymbol: string
) => {
  const isGasToken = token === ZEROADDRESS;
  const deployTx = await factory.deployLockbox(xToken, token, isGasToken, {
    ...overrides[hre.network.name],
  });
  const xERC20Receipt = await deployTx.wait(1);
  const logLength = xERC20Receipt.logs.length;
  const lockBoxAddr = `0x${xERC20Receipt.logs[logLength - 1].data.slice(26)}`;

  await storeDeployInfo(`${eContractid.LockBox}-${tokenSymbol}`, {
    address: lockBoxAddr,
    constructorArgs: [xToken, token, isGasToken, xERC20Receipt.from],
  });

  console.log(`LockBox-${tokenSymbol} deployed to: ${lockBoxAddr}`);

  return lockBoxAddr;
};

export const deployAAVEStrategyImpl = async () => {
  const AaveStrategyFactory = await ethers.getContractFactory("AaveStrategy");
  const AaveStrategyImpl = await AaveStrategyFactory.deploy({
    ...overrides[hre.network.name],
  });
  await AaveStrategyImpl.deploymentTransaction().wait(1);
  const implAddress = await AaveStrategyImpl.getAddress();
  await storeDeployInfo(eContractid.AaveStrategyImpl, {
    address: implAddress,
    constructorArgs: [],
  });

  console.log("AaveStrategyImpl deployed to:", implAddress);

  return implAddress;
};

export const deployAAVEStrategy = async (
  impl: tEthereumAddress,
  aave: tEthereumAddress,
  vault: tEthereumAddress,
  proxyAdmin: tEthereumAddress
) => {
  const AaveStrategyFactory = await ethers.getContractFactory("AaveStrategy");
  const initData = AaveStrategyFactory.interface.encodeFunctionData(
    "initialize",
    [aave, vault]
  );

  const ParallelProxyFactory = await ethers.getContractFactory("ParallelProxy");
  const ParallelProxy = await ParallelProxyFactory.deploy(
    impl,
    proxyAdmin,
    initData,
    {
      ...overrides[hre.network.name],
    }
  );
  await ParallelProxy.deploymentTransaction().wait(1);

  const proxyAddr = await ParallelProxy.getAddress();
  await storeDeployInfo(eContractid.AaveStrategyProxy, {
    address: proxyAddr,
    constructorArgs: [impl, proxyAdmin, initData],
  });

  return AaveStrategyFactory.attach(proxyAddr) as unknown as AaveStrategy;
};

export const deployETHAAVEStrategy = async (
  wstETH: tEthereumAddress,
  aave: tEthereumAddress,
  vault: tEthereumAddress,
  proxyAdmin: tEthereumAddress
) => {
  const ETHAaveStrategyFactory = await ethers.getContractFactory(
    "ETHAaveStrategy"
  );
  const IMPL = await ETHAaveStrategyFactory.deploy(wstETH, aave, vault, {
    ...overrides[hre.network.name],
  });
  await IMPL.deploymentTransaction().wait(1);
  const implAddress = await IMPL.getAddress();
  await storeDeployInfo(eContractid.ETHAaveStrategyImpl, {
    address: implAddress,
    constructorArgs: [wstETH, aave, vault],
  });
  console.log("ETHAAVEStrategy IMPL deployed to:", implAddress);

  const initData = ETHAaveStrategyFactory.interface.encodeFunctionData(
    "initialize",
    []
  );
  const ParallelProxyFactory = await ethers.getContractFactory("ParallelProxy");
  const ParallelProxy = await ParallelProxyFactory.deploy(
    implAddress,
    proxyAdmin,
    initData,
    {
      ...overrides[hre.network.name],
    }
  );
  await ParallelProxy.deploymentTransaction().wait(1);
  const proxyAddr = await ParallelProxy.getAddress();
  await storeDeployInfo(eContractid.ETHAaveStrategyProxy, {
    address: proxyAddr,
    constructorArgs: [implAddress, proxyAdmin, initData],
  });

  console.log("ETHAAVEStrategy Proxy deployed to:", proxyAddr);

  return ETHAaveStrategyFactory.attach(proxyAddr) as unknown as ETHAaveStrategy;
};

export const deployMOCKAAVE = async () => {
  const MockAAVEFactory = await ethers.getContractFactory("MockAAVE");

  const aave = await MockAAVEFactory.deploy({
    ...overrides[hre.network.name],
  });
  await aave.deploymentTransaction().wait(1);

  return aave as unknown as MockAAVE;
};

export const deployMOCKLICO = async () => {
  const MockLIDOFactory = await ethers.getContractFactory("MockLido");

  const lido = await MockLIDOFactory.deploy({
    ...overrides[hre.network.name],
  });
  await lido.deploymentTransaction().wait(1);

  return lido as unknown as MockLido;
};

export const deployMOCKWSTETH = async (stETH: tEthereumAddress) => {
  const MockWstETHFactory = await ethers.getContractFactory("MockWstETH");

  const wstETH = await MockWstETHFactory.deploy(stETH, {
    ...overrides[hre.network.name],
  });
  await wstETH.deploymentTransaction().wait(1);

  return wstETH as unknown as MockWstETH;
};

export const deployMintableERC20 = async () => {
  const MintableERC20Factory = await ethers.getContractFactory("MintableERC20");

  const token = await MintableERC20Factory.deploy(
    "Test Token Name",
    "Test Token symbol",
    {
      ...overrides[hre.network.name],
    }
  );
  await token.deploymentTransaction().wait(1);

  return token as unknown as MintableERC20;
};
