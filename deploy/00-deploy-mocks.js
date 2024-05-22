const { network } = require("hardhat"); // define >>>network .config.chainId
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config"); // default network

// const DECIMALS = "8";
// const INITIAL_PRICE = "200000000000"; // 2000
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts(); // hardhat.config namedAccounts:{deployer:{default:0},user:{default:1},}
    // const chainId = network.config.chainId; // hardhat

    // If we are on a local development network, we need to deploy mocks!
    if (developmentChains.includes(network.name)) {
        // network.name choose from helper-hardhat-config.js network localhost or hardhat
        // if (chainId == 31337) {
        log("Local network detected! Deploying mocks...");
        await deploy("MockV3Aggregator", {
            // contract/test/MockV3Aggregator.sol
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks Deployed!");
        log("------------------------------------------------");
        log(
            "You are deploying to a local network, you'll need a local network running to interact",
        );
        log(
            "Please run `npx hardhat console` to interact with the deployed smart contracts!",
        );
        log("------------------------------------------------");
    }
};
module.exports.tags = ["all", "mocks"];
