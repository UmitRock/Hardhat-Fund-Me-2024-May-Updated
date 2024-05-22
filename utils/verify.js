const { run } = require("hardhat");

async function verify(contractAddress, args) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      // "verify:verify came from hardhat-verify --help >> verifiy: Verify a contract on etherscan"
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.error(e);
    }
  }
}
module.exports = {
  verify,
};
