import hre from "hardhat";
import { getSocketAdapter, getXERC20 } from "./helpers/deployment";
import { MAX_UINT_AMOUNT } from "../test/helper/utils";
import { parseEther } from "ethers";

const sepoliaToArbiSwichboard = "0x501fCBa3e6F92b2D1d89038FeD56EdacaaF5f7c2";
const arbiToSepoliaSwichboard = "0xB9EDe9aaEaA40e35033ABBC872D141950d08cc4d";

async function configSepoliaAdapter() {
  const socketAdapter = await getSocketAdapter();
  await socketAdapter.setSocketConfig(
    421614,
    "0xbCA625aA516AC07248C41E2A0eBec56717160f5A",
    sepoliaToArbiSwichboard,
    "10000000"
  );
  await socketAdapter.configAssetMapping(
    "0xc1a3ed92614381310a7505c8f5c87f1eb6bf9fa7",
    421614,
    "0xb48b87687e35ed1d0d99296e0f6ff5c0b46e360e"
  );
}

async function configarbiturmSepoliaAdapter() {
  const socketAdapter = await getSocketAdapter();
  await socketAdapter.setSocketConfig(
    11155111,
    "0xf7fB70838A521B6578a616D858f3b78DF098CeAE",
    arbiToSepoliaSwichboard,
    "100000"
  );
  await socketAdapter.configAssetMapping(
    "0xb48b87687e35ed1d0d99296e0f6ff5c0b46e360e",
    11155111,
    "0xc1a3ed92614381310a7505c8f5c87f1eb6bf9fa7"
  );
}

async function configXToken() {
  const xToken = await getXERC20("DAI");
  const socketAdapter = await getSocketAdapter();
  await xToken.setLimits(
    await socketAdapter.getAddress(),
    MAX_UINT_AMOUNT,
    MAX_UINT_AMOUNT
  );
}

async function bridgeToken() {
  const socketAdapter = await getSocketAdapter();
  const dai = await getXERC20("DAI");
  //await dai.mint("0x018281853eCC543Aa251732e8FDaa7323247eBeB", parseEther("10000"));
  await dai.approve(await socketAdapter.getAddress(), MAX_UINT_AMOUNT);
  await socketAdapter.bridgeToken(await dai.getAddress(), "100000", 11155111, {
    value: parseEther("0.01"),
  });
}

async function main() {
  console.log("currnet network:", hre.network.name);

  // await configarbiturmSepoliaAdapter();
  //
  // await configXToken();
  await bridgeToken();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
