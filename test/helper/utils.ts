import {
  AaveStrategy,
  ETHAaveStrategy,
  MintableERC20,
  MockAAVE,
  MockLido,
  MockWstETH,
  XERC20,
  XERC20Factory,
  XERC20Lockbox,
} from "../../typechain-types";
import {
  deployAAVEStrategy,
  deployETHAAVEStrategy,
  deployFactory,
  deployLockbox,
  deployMintableERC20,
  deployMOCKAAVE,
  deployMOCKLICO,
  deployMOCKWSTETH,
  deployXERC20,
} from "../../script/helpers/deployment";
import { ZEROADDRESS } from "../../script/helpers/constants";
import { clearDeployInfo, getDeployInfo } from "../../script/helpers/utils";

const hre = require("hardhat");

export const MAX_UINT_AMOUNT =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export interface TestDeploymentEnv {
  erc20: MintableERC20;
  xERC20: XERC20;
  lockBox: XERC20Lockbox;
  ethXERC20: XERC20;
  ethLockBox: XERC20Lockbox;
  aaveStrategy: AaveStrategy;
  ethStrategy: ETHAaveStrategy;
  aave: MockAAVE;
  lido: MockLido;
}

export const deployFixture = async function () {
  const [, user1] = await hre.ethers.getSigners();

  clearDeployInfo();

  const erc20: MintableERC20 = await deployMintableERC20();
  const tokenAddress = await erc20.getAddress();
  const aave: MockAAVE = await deployMOCKAAVE();
  const lido: MockLido = await deployMOCKLICO();
  const wstETH: MockWstETH = await deployMOCKWSTETH(await lido.getAddress());
  const factory: XERC20Factory = await deployFactory();

  const xERC20 = await deployXERC20(
    factory,
    "TestTokenName",
    "TestTokenSymbol"
  );
  const lockBox = await deployLockbox(
    factory,
    await xERC20.getAddress(),
    tokenAddress,
    "TestTokenSymbol"
  );
  const ethXERC20 = await deployXERC20(factory, "ETHXERC20", "ETHXERC20");
  const ethLockBox = await deployLockbox(
    factory,
    await ethXERC20.getAddress(),
    ZEROADDRESS,
    "ETHXERC20"
  );

  const aaveStrategy = await deployAAVEStrategy(
    "TestTokenSymbol",
    await aave.getAddress(),
    await lockBox.getAddress(),
    await user1.getAddress()
  );

  const ethStrategy = await deployETHAAVEStrategy(
    await wstETH.getAddress(),
    await aave.getAddress(),
    await ethLockBox.getAddress(),
    await user1.getAddress()
  );

  await lockBox.setStrategy(await aaveStrategy.getAddress());
  await ethLockBox.setStrategy(await ethStrategy.getAddress());

  return {
    erc20: erc20,
    xERC20: xERC20,
    lockBox: lockBox,
    ethXERC20: ethXERC20,
    ethLockBox: ethLockBox,
    aaveStrategy: aaveStrategy,
    ethStrategy: ethStrategy,
    aave: aave,
    lido: lido,
  } as TestDeploymentEnv;
};
