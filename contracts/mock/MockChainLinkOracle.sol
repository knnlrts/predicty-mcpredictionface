// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "../interfaces/AggregatorV3Interface.sol";

contract MockChainLinkOracle is AggregatorV3Interface {

	 int256 latestAns = 47545000000;
	 uint256 updatedInit = block.timestamp;

   struct RoundData {
      uint80 roundId;
      int256 answer;
      uint256 startedAt;
      uint256 updatedAt;
      uint80 answeredInRound;
   }

   mapping(uint80 => RoundData) public roundData;
   uint80 public currentRound;

   constructor() public {
      currentRound = 0;
      roundData[0] = RoundData(uint80(0),latestAns, updatedInit, updatedInit, uint80(0));
   }

  function decimals() override external pure returns (uint8) {
    return uint8(8);
  }

  function description() override external pure returns (string memory) {
    return "ETH/USD";
  }

  function version() override external pure returns (uint256) {
    return uint256(1);
  }

	/**
  * @dev Gets the latest answer of chainLink oracle.
  * @return int256 representing the latest answer of chainLink oracle.
  */
	 function latestAnswer() external view returns (int256) {
     return roundData[currentRound].answer;
	 }

	/**
  * @dev Set the latest answer of chainLink oracle.
  * @param _latestAnswer The latest anser of chainLink oracle.
  */
	 function setLatestAnswer(int256 _latestAnswer) public {
     currentRound = currentRound + uint80(1);
     roundData[currentRound] = RoundData(currentRound,_latestAnswer, block.timestamp, block.timestamp, currentRound);
	 }

	 function getRoundData(uint80 _roundId) override external view returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
    	return (roundData[_roundId].roundId, roundData[_roundId].answer, roundData[_roundId].startedAt,
              roundData[_roundId].updatedAt,roundData[_roundId].answeredInRound);
    }

  	function latestRoundData() override external view returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
    	return (roundData[currentRound].roundId, roundData[currentRound].answer, roundData[currentRound].startedAt,
              roundData[currentRound].updatedAt,roundData[currentRound].answeredInRound);
    }

}
