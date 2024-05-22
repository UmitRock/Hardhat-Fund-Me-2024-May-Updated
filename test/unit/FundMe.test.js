// Unit tests are done locally
// testing small pieces of the code for correct behavior
const { deployments, network, ethers } = require("hardhat"); // getNamedAccount no longer use it in etherv6
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) // only run this test on hardhat
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          let mockV3AggregatorAddress;
          let fundMeAddress;
          const sendValue = ethers.parseEther("1"); // 1 ETH

          beforeEach(async function () {
              // deploy our contract
              // using hardhat deploy

              const accounts = await ethers.getSigners(); // This retrieves a list of accounts (signers) from the Ethereum network configured by Hardhat.
              deployer = accounts[0]; // Use the first account as the deployer.
              // deployer = (await getNamedAccounts()).deployer; // another way to get deployer accountsbut no longer use it in etherv6
              const Deployments = await deployments.fixture(["all"]); // will deploys all contracts in deploy or (ignition) folder and "all" argument typically refers to a tags that encompasses all >> module.exports.tags = ["all"] inside deply folder both js file 01 fund and 00 mock;

              fundMeAddress = Deployments.FundMe.address; // fundMeAddress define before it and fundMeAddress is Retrieves the address where the FundMe contract is deployed
              mockV3AggregatorAddress = Deployments.MockV3Aggregator.address; //  define before it and mockV3AggregatorAddress is Retrieves the address where the "MockV3Aggregator" contract is deployed.
              fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeAddress,
                  deployer,
              ); // fundMe is a contract object that represents the deployed contract.  Creates an instance of the "FundMe" contract at the deployed address using the deployer account
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3AggregatorAddress,
                  deployer,
              ); // mockV3Aggregator is a contract object that represents the deployed contract.  Creates an instance of the "MockV3Aggregator" contract at the deployed address using the deployer account
          });
          describe("constructor", function () {
              it("Sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed(); // use function getpriceFeed after save s_priceFeed in memory for get Cheap Gas
                  assert.equal(response, mockV3AggregatorAddress); // assert.equal(response, mockV3AggregatorAddress) is to check if the response is equal to the mockV3AggregatorAddress.
              });
          });

          describe("fund", function () {
              it("Fails if you dont send enough ETH", async function () {
                  /* expecting to fail >> msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"*/
                  await expect(fundMe.fund()).to.be.revertedWith(
                      // expect not enough and transaction reverted with message
                      "You need to spend more ETH!",
                  );
              });
              it("updated the amount data structure", async function () {
                  await fundMe.fund({ value: sendValue }); // fund function is to fund the contract with the specified amount of ETH.
                  const response =
                      await fundMe.getAddressToAmountFunded(deployer); // getAddressToAmountFunded function is to get the amount of ETH that a specific address mean mapping of each addresses how much has funded to the contract and use deployer to should give us the amount send it. >> mapping(address => uint256) private s_addressToAmountFunded;
                  assert.equal(response.toString(), sendValue.toString()); // assert.equal(response.toString(), sendValue.toString()) is to check if the response is equal to the sendValue.
              });
              it("Adds funder to array of funders", async function () {
                  // funder.push(msg.sender)
                  await fundMe.fund({ value: sendValue }); // fund function is to fund the contract with the specified amount of ETH.
                  const response = await fundMe.getFunder(0); // getFunder function is to get the address of the funder called funder array at 0 index
                  assert.equal(response, deployer.address); // assert.equal(response, deployer.address) is to check if the response is equal to the deployer.address.
              });
          }); // in terminal>> yarn hardhat test --grep "funder to array"     to see this function only

          describe("withdraw", async function () {
              beforeEach(async function () {
                  // before test withdraw add 1 ETH to fundMe contract
                  await fundMe.fund({ value: sendValue });
              });
              it("withdraws ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target); // getBalance function is to get the balance of fundMe contract. no longer use .address in etherv6 must use .target
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer); // getBalance function is to get the balance of deployer.
                  console.log(
                      `\nstartingFundMeBalance: ${startingFundMeBalance}`,
                  ); // 1000000000000000000
                  console.log(
                      `\nstartingDeployerBalance: ${startingDeployerBalance}`,
                  ); // 9998998502383271318237

                  // Act
                  const transactionResponse = await fundMe.withdraw(); // withdraw from fundMe contract called transactionResponse mean fundMe are 0 eth
                  const transactionReceipt = await transactionResponse.wait(1); // wait function is to wait for the transaction to be mined 1 block.

                  // const { gasUsed, effectiveGasPrice } = transactionReceipt; // effectiveGasPrice are no longer use it now called gasPrice
                  // const gasCost = gasUsed * effectiveGasPrice;
                  const { gasUsed, gasPrice } = transactionReceipt; // fee show on debug javacscript
                  const gasCost = gasUsed * gasPrice;
                  console.log(`GasUsed: ${gasUsed}`);
                  console.log(`GasPrice: ${gasPrice}`);
                  console.log(`GasCost: ${gasCost}`);

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  console.log(`\nendingFundMeBalance: ${endingFundMeBalance}`); // 0
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer); // spend of gas with deployor
                  console.log(
                      `\nendingDeployerBalance: ${endingDeployerBalance}`,
                  ); // 9999998481119727960477
                  // Assert
                  // Maybe clean up to understand the testing
                  assert.equal(endingFundMeBalance, 0);
                  console.log(
                      `\nStart FundMe + Start Deploy: ${startingFundMeBalance + startingDeployerBalance}`,
                  ); // 9999998481119727960477
                  console.log(
                      `\nEnd Deploy with GasCost: ${endingDeployerBalance + gasCost}`,
                  ); // 9999998481119727960477
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost,
                  );
              });

              // this test is overloaded. Ideally we'd split it into multiple tests
              // but for simplicity we left it as one
              it("is allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners(); // loops all accounts
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      ); // loops all accounts and connect to fundMe contract
                      await fundMeConnectedContract.fund({ value: sendValue }); // loops all accounts and fund to fundMe contract
                  }
                  // now checking both balance
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait();
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const withdrawGasCost = gasUsed * gasPrice;
                  console.log(`GasCost: ${withdrawGasCost}`);
                  console.log(`GasUsed: ${gasUsed}`);
                  console.log(`GasPrice: ${gasPrice}`);
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + withdrawGasCost,
                  );
                  // make sure that funders are reset properly
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted; //address[] private s_funders;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0,
                      ); // make sure all accounts are 0 >>mapping(address => uint256) private s_addressToAmountFunded;
                  }
              });
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  // console.log(accounts);
                  // [
                  //     HardhatEthersSigner {
                  //       _gasLimit: 30000000,
                  //       address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                  //       provider: HardhatEthersProvider {
                  //         _hardhatProvider: [LazyInitializationProviderAdapter],
                  //         _networkName: 'hardhat',
                  //         _blockListeners: [],
                  //         _transactionHashListeners: Map(0) {},
                  //         _eventListeners: []
                  //       }
                  //     },
                  //     HardhatEthersSigner .....},
                  //     HardhatEthersSigner {
                  //       _gasLimit: 30000000,
                  //       address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
                  //       provider: HardhatEthersProvider {
                  //         _hardhatProvider: [LazyInitializationProviderAdapter],
                  //         _networkName: 'hardhat',
                  //         _blockListeners: [],
                  //         _transactionHashListeners: Map(0) {},
                  //         _eventListeners: []
                  //       }
                  //     }
                  //   ]
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1],
                  ); // fundMe connected to first random accounts
                  // await expect(fundMeConnected.withdraw()).to.be.reverted; // should not be to withraw..mean other account try withraw will reverted >> FundMe__NotOwner
                  await expect(
                      fundMeConnectedContract.withdraw(),
                  ).to.be.revertedWithCustomError(
                      fundMeConnectedContract,
                      "FundMe__NotOwner",
                  ); // same get with specific error >> FundMe__NotOwner
              });
              it("cheaper Withdraw testing....", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners(); // loops all accounts
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      ); // loops all accounts and connect to fundMe contract
                      await fundMeConnectedContract.fund({ value: sendValue }); // loops all accounts and fund to fundMe contract
                  }
                  // now checking both balance
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait();
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const withdrawGasCost = gasUsed * gasPrice;
                  console.log(`GasCost: ${withdrawGasCost}`);
                  console.log(`GasUsed: ${gasUsed}`);
                  console.log(`GasPrice: ${gasPrice}`);
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + withdrawGasCost,
                  );
                  // make sure that funders are reset properly
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted; //address[] private s_funders;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0,
                      ); // make sure all accounts are 0 >>mapping(address => uint256) private s_addressToAmountFunded;
                  }
              });
          });
      });

// get gas reporter enable from hardhat config >> yarn hardhat test >> open txt file
