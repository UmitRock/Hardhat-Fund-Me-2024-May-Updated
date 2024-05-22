// import
// main function
// calling of main function

// function deployFunc() {
//   console.log("hi..");
// }

// module.exports.default = deployFunc;
// Output>>Nothing to compile hi..Done in 2.53s.
// instead of this 2 lines >> module.exports = async (hre) => {
//    const { getNamedAccounts, deployments} = hre; // called syntax suger
// hre.getNameAccounts()
// hre.deployments()
// we do this
const { network } = require("hardhat");
// or
// const helperConfig = require("../helper-hardhat-config");
// or
// const networkConfig = helperConfig.networkConfig;
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts(); // hardhat.config namedAccounts:{deployer:{default:0},user:{default:1},}
    const chainId = network.config.chainId; //<< define chainId

    // if chainId is X use address Y
    // if chainIf is Z use address A
    // to enable this functions use aave-v3-core

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        // hardhat
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]; // yarn hardhat deply --network polygon or sepolia
    }
    // default network but not have pricefeed on local
    // if the contract dosen't exist, we deploy a minimal version of it for out local testing

    // well whats happen when we want to change chains?
    // when going for localhost or hardhat network we want to use a mocka >> modified AggregatorV3Interface and priceFeed
    log("----------------------------------------------------");
    log("Deploying FundMe and waiting for confirmations...");
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        log: true,
        args: args, // Put price feed address
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log(`FundMe deployed at ${fundMe.address}`);

    if (!developmentChains.includes(network.name) && process.env.ETHER_API) {
        // Verify the deployment
        await verify(fundMe.address, args);
    }
    log("-------------------------------------");
};

module.exports.tags = ["all", "fundme"];
// test fundme on sepolia >> yarn hardhat deploy --network sepolia
// test fundme on localhost >> yarn hardhat deploy --network localhost or hardhat
