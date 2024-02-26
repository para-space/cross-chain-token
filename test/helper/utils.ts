import {
  AaveStrategy,
  ApeStakingStrategy,
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
import {
  deployAAVEStrategy,
  deployApeStakingStrategy,
  deployERC721Factory,
  deployERC721Lockbox,
  deployETHAAVEStrategy,
  deployFactory,
  deployLockbox,
  deployMintableERC20,
  deployMintableERC721,
  deployMOCKAAVE,
  deployMOCKLICO,
  deployMOCKWSTETH,
  deployXERC20,
  deployXERC721,
} from "../../script/helpers/deployment";
import { ZEROADDRESS } from "../../script/helpers/constants";
import { clearDeployInfo, getDeployInfo } from "../../script/helpers/utils";

const hre = require("hardhat");

export const MAX_UINT_AMOUNT =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const advanceTimeAndBlock = async function (forwardTime: number) {
  const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
  const currentBlock = await hre.ethers.provider.getBlock(currentBlockNumber);
  const currentTime = currentBlock.timestamp;
  const futureTime = currentTime + forwardTime;
  await hre.ethers.provider.send("evm_setNextBlockTimestamp", [futureTime]);
  await hre.ethers.provider.send("evm_mine", []);
};

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
  bayc: MintableERC721;
  xBayc: XERC721;
  xBaycLockbox: XERC721Lockbox;
  mayc: MintableERC721;
  xMayc: XERC721;
  xMaycLockbox: XERC721Lockbox;
  bakc: MintableERC721;
  xBakc: XERC721;
  xBakcLockbox: XERC721Lockbox;
  apeStrategy: ApeStakingStrategy;
}

export const deployFixture = async function () {
  const [, user1] = await hre.ethers.getSigners();

  clearDeployInfo();

  //ERC20
  const erc20: MintableERC20 = await deployMintableERC20(
    "Test Token Name",
    "Test Token symbol"
  );
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

  //ERC721
  const erc721Factory: XERC721Factory = await deployERC721Factory();
  const bayc: MintableERC721 = await deployMintableERC721("BAYC");
  const mayc: MintableERC721 = await deployMintableERC721("MAYC");
  const bakc: MintableERC721 = await deployMintableERC721("BAKC");

  const xBayc = await deployXERC721(erc721Factory, "BAYC", "BAYC");
  const xBaycLockbox = await deployERC721Lockbox(
    erc721Factory,
    await xBayc.getAddress(),
    await bayc.getAddress(),
    "BAYC"
  );
  const xMayc = await deployXERC721(erc721Factory, "MAYC", "MAYC");
  const xMaycLockbox = await deployERC721Lockbox(
    erc721Factory,
    await xMayc.getAddress(),
    await mayc.getAddress(),
    "MAYC"
  );
  const xBakc = await deployXERC721(erc721Factory, "BAKC", "BAKC");
  const xBakcLockbox = await deployERC721Lockbox(
    erc721Factory,
    await xBakc.getAddress(),
    await bakc.getAddress(),
    "BAKC"
  );
  const apeStrategy = await deployApeStakingStrategy(await user1.getAddress());

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
    bayc: bayc,
    xBayc: xBayc,
    xBaycLockbox: xBaycLockbox,
    mayc: mayc,
    xMayc: xMayc,
    xMaycLockbox: xMaycLockbox,
    bakc: bakc,
    xBakc: xBakc,
    xBakcLockbox: xBakcLockbox,
    apeStrategy: apeStrategy,
  } as TestDeploymentEnv;
};
