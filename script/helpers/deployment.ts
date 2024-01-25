import { eContractid, tEthereumAddress } from "../types";
import hre, { ethers } from "hardhat";
import {
  AaveStrategy,
  ApeStakingStrategy,
  ERC20,
  ETHAaveStrategy,
  MintableERC20,
  MintableERC721,
  MockAAVE,
  MockLido,
  MockWstETH,
  XERC20,
  XERC20Factory,
  XERC20Lockbox,
  XERC721,
  XERC721Factory,
  XERC721Lockbox,
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
  const ContractKey = eContractid.XERC20Factory;
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

export const deployERC721Factory = async () => {
  const XERC721FactoryFactory = await ethers.getContractFactory(
    "XERC721Factory"
  );
  const ContractKey = eContractid.XERC721Factory;
  let factoryAddr = getDeployed(ContractKey);
  if (!factoryAddr) {
    const XERC721Factory = await XERC721FactoryFactory.deploy({
      ...overrides[hre.network.name],
    });
    await XERC721Factory.deploymentTransaction().wait(1);

    factoryAddr = await XERC721Factory.getAddress();
    await storeDeployInfo(ContractKey, {
      address: factoryAddr,
      constructorArgs: [],
    });
  }

  return XERC721FactoryFactory.attach(factoryAddr) as unknown as XERC721Factory;
};

export const deployXERC721 = async (
  factory: XERC721Factory,
  tokenName: string,
  tokenSymbol: string
) => {
  const XERC721Factory = await ethers.getContractFactory("XERC721");
  const ContractKey = `${eContractid.XERC721}-${tokenSymbol}`;
  let xERC721Addr = getDeployed(ContractKey);
  if (!xERC721Addr) {
    const xTokenName = `x${tokenName}`;
    const xTokenSymbol = `x${tokenSymbol}`;
    const deployTx = await factory.deployXERC721(
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
    xERC721Addr = `0x${xERC20Receipt.logs[logLength - 1].data.slice(26)}`;

    await storeDeployInfo(ContractKey, {
      address: xERC721Addr,
      constructorArgs: [xTokenName, xTokenSymbol, await factory.getAddress()],
    });
  }

  return XERC721Factory.attach(xERC721Addr) as unknown as XERC721;
};

export const deployERC721Lockbox = async (
  factory: XERC721Factory,
  xToken: string,
  token: string,
  tokenSymbol: string
) => {
  const XERC721LockboxFactory = await ethers.getContractFactory(
    "XERC721Lockbox"
  );
  const ContractKey = `${eContractid.ERC721LockBox}-${tokenSymbol}`;
  let lockBoxAddr = getDeployed(ContractKey);
  if (!lockBoxAddr) {
    const deployTx = await factory.deployXERC721Lockbox(xToken, token, {
      ...overrides[hre.network.name],
    });
    const xERC721Receipt = await deployTx.wait(1);
    const logLength = xERC721Receipt.logs.length;
    lockBoxAddr = `0x${xERC721Receipt.logs[logLength - 1].data.slice(26)}`;

    await storeDeployInfo(ContractKey, {
      address: lockBoxAddr,
      constructorArgs: [xToken, token, xERC721Receipt.from],
    });
  }

  return XERC721LockboxFactory.attach(lockBoxAddr) as unknown as XERC721Lockbox;
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

export const deployMintableERC721 = async (symbol: string) => {
  const MintableERC721Factory = await ethers.getContractFactory(
    "MintableERC721"
  );

  const token = await MintableERC721Factory.deploy(symbol, symbol, "", {
    ...overrides[hre.network.name],
  });
  await token.deploymentTransaction().wait(1);

  return token as unknown as MintableERC721;
};

export const deployApeStakingStrategyImpl = async (
  baycVaultAddr: tEthereumAddress,
  maycVaultAddr: tEthereumAddress,
  bakcVaultAddr: tEthereumAddress
) => {
  const ApeStakingFactory = await ethers.getContractFactory(
    "ApeStakingStrategy"
  );
  const ContractKey = eContractid.ApeStakingStrategyImpl;
  let implAddress = getDeployed(ContractKey);
  if (!implAddress) {
    const apeStakingStrategy = await ApeStakingFactory.deploy(
      baycVaultAddr,
      maycVaultAddr,
      bakcVaultAddr,
      {
        ...overrides[hre.network.name],
      }
    );
    await apeStakingStrategy.deploymentTransaction().wait(1);
    implAddress = await apeStakingStrategy.getAddress();
    await storeDeployInfo(ContractKey, {
      address: implAddress,
      constructorArgs: [baycVaultAddr, maycVaultAddr, bakcVaultAddr],
    });
  }

  return ApeStakingFactory.attach(implAddress) as unknown as ApeStakingStrategy;
};

export const deployApeStakingStrategy = async (
  proxyAdmin: tEthereumAddress
) => {
  const baycVaultKey = `${eContractid.ERC721LockBox}-BAYC`;
  const baycVaultAddr = getDeployed(baycVaultKey);
  if (!baycVaultAddr) {
    console.log("skip, bayc lockbox not ready");
    return null;
  }

  const maycVaultKey = `${eContractid.ERC721LockBox}-MAYC`;
  const maycVaultAddr = getDeployed(maycVaultKey);
  if (!maycVaultAddr) {
    console.log("skip, mayc lockbox not ready");
    return null;
  }

  const bakcVaultKey = `${eContractid.ERC721LockBox}-BAKC`;
  const bakcVaultAddr = getDeployed(bakcVaultKey);
  if (!bakcVaultAddr) {
    console.log("skip, bakc lockbox not ready");
    return null;
  }

  const ApeStakingFactory = await ethers.getContractFactory(
    "ApeStakingStrategy"
  );
  const ContractKey = eContractid.ApeStakingStrategyProxy;
  let proxyAddr = getDeployed(ContractKey);
  if (!proxyAddr) {
    const implAddress = await (
      await deployApeStakingStrategyImpl(
        baycVaultAddr,
        maycVaultAddr,
        bakcVaultAddr
      )
    ).getAddress();
    const initData = ApeStakingFactory.interface.encodeFunctionData(
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

  //set strategy
  const XERC721LockboxFactory = await ethers.getContractFactory(
    "XERC721Lockbox"
  );
  const baycVault = XERC721LockboxFactory.attach(
    baycVaultAddr
  ) as unknown as XERC721Lockbox;
  const maycVault = XERC721LockboxFactory.attach(
    maycVaultAddr
  ) as unknown as XERC721Lockbox;
  const bakcVault = XERC721LockboxFactory.attach(
    bakcVaultAddr
  ) as unknown as XERC721Lockbox;

  await baycVault.setStrategy(proxyAddr);
  await maycVault.setStrategy(proxyAddr);
  await bakcVault.setStrategy(proxyAddr);

  return ApeStakingFactory.attach(proxyAddr) as unknown as ApeStakingStrategy;
};
