import hre from "hardhat";
import {deployMintableERC20, getSocketAdapter, getXERC20} from "./helpers/deployment";
import { MAX_UINT_AMOUNT } from "../test/helper/utils";
import { parseEther } from "ethers";

const sepoliaToArbiSwichboard = "0x501fCBa3e6F92b2D1d89038FeD56EdacaaF5f7c2";
const arbiToSepoliaSwichboard = "0xB9EDe9aaEaA40e35033ABBC872D141950d08cc4d";

const Kept = "0x7fc639b266aa38308fa5231425a3f9e987983678";
const LRT = "0xcc2867282ab1bc51135e831e7d1cc47dd1345cbe";
const pufETH = "0x2d2b91c3d2718aad3ea888d924a6b01c07b68530";
const eETH = "0xa2168d4475cd75649e19367cd26d6eda92cb1f41";
const LSETH = "0x146a1d8a75ab668635f5bf8ddc1d5d5f862815db";
const swETH = "0x9820dfb09724a85b7223904c91dd0cfb9a0dbadb";
const ezETH = "0x5419c015b2d3f1e4600204ed7a67b8a97fdf0429";
const wstETH = "0x28b981b61443dcd067183be543d8e090aaadd319";
const weth = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";


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

async function deployTestToken() {
    await deployMintableERC20("Kelp", "Kelp", );//BNB
    await deployMintableERC20("LRT", "LRT");//Pollygon
    await deployMintableERC20("pufETH", "pufETH");
    await deployMintableERC20("ether.fi ETH", "eETH");
    await deployMintableERC20("Liquid Staked ETH", "LSETH");
    await deployMintableERC20("swETH", "swETH");
    await deployMintableERC20("Renzo Restaked ETH", "ezETH");
    await deployMintableERC20("Wrapped liquid staked Ether 2.0 ", "wstETH");
}

async function main() {
    console.log("currnet network:", hre.network.name);

    await deployTestToken();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
