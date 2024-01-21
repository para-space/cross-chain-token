import { eContractid, tEthereumAddress } from "../types";
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
  XERC20Lockbox,
} from "../../typechain-types";
import { overrides } from "./networks";
import { getDeployInfo, storeDeployInfo } from "./utils";
import { ZEROADDRESS } from "./constants";

export const getERC20 = async (address: tEthereumAddress) => {
  const ERC20Factory = await ethers.getContractFactory("ERC20");
  return ERC20Factory.attach(address) as unknown as ERC20;
};

const getDeployed = (key: string) => {
  const deployInfo = getDeployInfo();
  if (!!deployInfo[key]) {
    return deployInfo[key].address;
  } else {
    return null;
  }
};

export const deployFactory = async () => {
  const XERC20FactoryFactory = await ethers.getContractFactory("XERC20Factory");
  const ContractKey = "XERC20Factory";
  let factoryAddr = getDeployed(ContractKey);
  if (!factoryAddr) {
    const XERC20Factory = await XERC20FactoryFactory.deploy({
      ...overrides[hre.network.name],
    });
    await XERC20Factory.deploymentTransaction().wait(1);

    factoryAddr = await XERC20Factory.getAddress();
    await storeDeployInfo(ContractKey, {
      address: factoryAddr,
      constructorArgs: [],
    });
  }

  return XERC20FactoryFactory.attach(factoryAddr) as unknown as XERC20Factory;
};

export const deployXERC20 = async (
  factory: XERC20Factory,
  tokenName: string,
  tokenSymbol: string
) => {
  const XERC20Factory = await ethers.getContractFactory("XERC20");
  const ContractKey = `${eContractid.XERC20}-${tokenSymbol}`;
  let xERC20Addr = getDeployed(ContractKey);
  if (!xERC20Addr) {
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
    xERC20Addr = `0x${xERC20Receipt.logs[logLength - 1].data.slice(26)}`;

    await storeDeployInfo(ContractKey, {
      address: xERC20Addr,
      constructorArgs: [xTokenName, xTokenSymbol, await factory.getAddress()],
    });
  }

  return XERC20Factory.attach(xERC20Addr) as unknown as XERC20;
};

export const deployLockbox = async (
  factory: XERC20Factory,
  xToken: string,
  token: string,
  tokenSymbol: string
) => {
  const XERC20LockboxFactory = await ethers.getContractFactory("XERC20Lockbox");
  const ContractKey = `${eContractid.LockBox}-${tokenSymbol}`;
  let lockBoxAddr = getDeployed(ContractKey);
  if (!lockBoxAddr) {
    const isGasToken = token === ZEROADDRESS;
    const deployTx = await factory.deployLockbox(xToken, token, isGasToken, {
      ...overrides[hre.network.name],
    });
    const xERC20Receipt = await deployTx.wait(1);
    const logLength = xERC20Receipt.logs.length;
    lockBoxAddr = `0x${xERC20Receipt.logs[logLength - 1].data.slice(26)}`;

    await storeDeployInfo(ContractKey, {
      address: lockBoxAddr,
      constructorArgs: [xToken, token, isGasToken, xERC20Receipt.from],
    });
  }

  return XERC20LockboxFactory.attach(lockBoxAddr) as unknown as XERC20Lockbox;
};

export const deployAAVEStrategyImpl = async () => {
  const AaveStrategyFactory = await ethers.getContractFactory("AaveStrategy");
  const ContractKey = eContractid.AaveStrategyImpl;
  let implAddress = getDeployed(ContractKey);
  if (!implAddress) {
    const AaveStrategyImpl = await AaveStrategyFactory.deploy({
      ...overrides[hre.network.name],
    });
    await AaveStrategyImpl.deploymentTransaction().wait(1);
    implAddress = await AaveStrategyImpl.getAddress();
    await storeDeployInfo(ContractKey, {
      address: implAddress,
      constructorArgs: [],
    });
  }

  return AaveStrategyFactory.attach(implAddress) as unknown as AaveStrategy;
};

export const deployETHAAVEStrategyImpl = async (
  wstETH: tEthereumAddress,
  aave: tEthereumAddress,
  vault: tEthereumAddress
) => {
  const ETHAaveStrategyFactory = await ethers.getContractFactory(
    "ETHAaveStrategy"
  );
  const ContractKey = eContractid.ETHAaveStrategyImpl;
  let implAddress = getDeployed(ContractKey);
  if (!implAddress) {
    const IMPL = await ETHAaveStrategyFactory.deploy(wstETH, aave, vault, {
      ...overrides[hre.network.name],
    });
    await IMPL.deploymentTransaction().wait(1);
    implAddress = await IMPL.getAddress();
    await storeDeployInfo(ContractKey, {
      address: implAddress,
      constructorArgs: [wstETH, aave, vault],
    });
  }

  return ETHAaveStrategyFactory.attach(
    implAddress
  ) as unknown as ETHAaveStrategy;
};

export const deployAAVEStrategy = async (
  tokenSymbol: string,
  aave: tEthereumAddress,
  vault: tEthereumAddress,
  proxyAdmin: tEthereumAddress
) => {
  const AaveStrategyFactory = await ethers.getContractFactory("AaveStrategy");
  const ContractKey = `${eContractid.AaveStrategyProxy}-${tokenSymbol}`;
  let proxyAddr = getDeployed(ContractKey);
  if (!proxyAddr) {
    const implAddress = await (await deployAAVEStrategyImpl()).getAddress();

    const initData = AaveStrategyFactory.interface.encodeFunctionData(
      "initialize",
      [aave, vault]
    );

    const ParallelProxyFactory = await ethers.getContractFactory(
      "ParallelProxy"
    );
    const ParallelProxy = await ParallelProxyFactory.deploy(
      implAddress,
      proxyAdmin,
      initData,
      {
        ...overrides[hre.network.name],
      }
    );
    await ParallelProxy.deploymentTransaction().wait(1);

    proxyAddr = await ParallelProxy.getAddress();
    await storeDeployInfo(ContractKey, {
      address: proxyAddr,
      constructorArgs: [implAddress, proxyAdmin, initData],
    });
  }

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
  const ContractKey = eContractid.ETHAaveStrategyProxy;
  let proxyAddr = getDeployed(ContractKey);
  if (!proxyAddr) {
    const implAddress = await (
      await deployETHAAVEStrategyImpl(wstETH, aave, vault)
    ).getAddress();

    const initData = ETHAaveStrategyFactory.interface.encodeFunctionData(
      "initialize",
      []
    );
    const ParallelProxyFactory = await ethers.getContractFactory(
      "ParallelProxy"
    );
    const ParallelProxy = await ParallelProxyFactory.deploy(
      implAddress,
      proxyAdmin,
      initData,
      {
        ...overrides[hre.network.name],
      }
    );
    await ParallelProxy.deploymentTransaction().wait(1);
    proxyAddr = await ParallelProxy.getAddress();
    await storeDeployInfo(ContractKey, {
      address: proxyAddr,
      constructorArgs: [implAddress, proxyAdmin, initData],
    });
  }

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
