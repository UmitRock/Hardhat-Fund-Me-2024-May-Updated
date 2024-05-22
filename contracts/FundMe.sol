// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.7;
// 2. Imports
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// error Codes
error FundMe__NotOwner();

// 3. Interfaces, Libraries, Contracts

/**@title A sample Funding Contract >>A contract for crowd funding
 * @author Patrick Collins Updated By Omeed Rock 2024 May
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    AggregatorV3Interface private s_priceFeed; // modified to use mocka on 01-fund-me.js

    // Events (we have none!)

    // Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // 1.constructor
    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed); // modified to use mocka on 01-fund-me.js
        i_owner = msg.sender;
    }

    // 2.Receive 3.fallback
    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \
    //         yes  no
    //         /     \
    //    receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this Contract >>Funds our contract based on the ETH/USD price
     * @dev This implements price feeds as our library
     */

    function fund() public payable {
        // inside param(priceFeed) modified to use mocka on 01-fund-me.js
        // must update getPrice and getAmount inside PriceConvertor.sol
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    // commit no longer for use for mock 01-fund-me.js
    // function getVersion() public view returns (uint256){
    //     // ETH/USD price feed address of Sepolia Network.
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    //     return priceFeed.version();
    // }
    // end commit

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // Transfer vs call vs Send
        // // 01.Transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // 02.Send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // 03.Call
        (bool success, ) = i_owner.call{ value: address(this).balance }("");
        require(success);
    }

    // turn s_funders into memory function for mapping adresses to get CheapWithdraw
    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        // mappings can't be in memory, sorry!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        (bool success, ) = i_owner.call{ value: address(this).balance }("");
        require(success);
    }

    // Concepts we didn't cover yet (will cover in later sections)
    // 1. Enum
    // 2. Events
    // 3. Try / Catch
    // 4. Function Selector
    // 5. abi.encode / decode
    // 6. Hash with keccak256
    // 7. Yul / Assembly

    // functions Orders:

    // 1.constructor
    // constructor(address priceFeedAddress) {
    //     i_owner = msg.sender;
    //     priceFeed = AggregatorV3Interface(priceFeedAddress); // modified to use mocka on 01-fund-me.js
    // }

    // 2.Receive 3.fallback
    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    // 4.External
    // function that is called when fund() is called
    // function fund() public payable {

    // 5.Public (can be called by anyone)
    // function getVersion() public view returns (uint256) {
    //     // ETH/USD price feed address of Sepolia Network.
    //     // AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    //     return priceFeed.version();
    // }

    // 6.Internal
    // function getPrice() public view returns (uint256) {
    //     (, int256 answer, , , ) = priceFeed.latestRoundData();
    //     // ETH in terms of USD
    //     return uint256(answer * 1000000000000000000);

    // }
    // 7.Private
    // function getVersion() private view returns (uint256) {
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    //     return priceFeed.version();
    // }

    // 8.View / Pure
    // function getEntranceFee() public view returns (uint256) {

    //     // minimumUSD
    //     // 3000
    //     // 1000000000000000000
    //     // (100 * 10**18)
    //     uint256 minimumUSD = 50 * 10**18;
    //     uint256 price = getPrice();
    //     uint256 precision = 1 * 10**18;
    //     return (minimumUSD * precision) / price;
    //     // return (minimumUSD * 10**18) / priceFeed.price();
    //     // return 50 * (10**18) / getPrice();
    //     // ETH/USD price feed address of Sepolia Network.
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    //     return priceFeed.version();
    // }

    /** @notice Gets the amount that an address has funded
     *  @param fundingAddress the address of the funder
     *  @return the amount funded
     */

    // remove from Storage and use it in memory function
    function getAddressToAmountFunded(
        address fundingAddress
    ) public view returns (uint256) {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
