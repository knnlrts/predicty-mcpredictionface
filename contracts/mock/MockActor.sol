// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "../Predicty.sol";

contract MockActor {

    address predicty;

    constructor(address _predicty) public {
        predicty = _predicty;
    }

    function placeBet(uint _bet, uint _option) public payable returns(bool) {
      (bool success, ) = address(predicty).call{gas: 1000000, value: _bet}(abi.encodeWithSignature("placeBet(Option)", _option));
      return success;
    }

    function settleMarket() public returns(bool) {
      (bool success, ) = address(predicty).call(abi.encodeWithSignature("settleMarket()"));
      return success;
    }

    function createNewMarket() public returns(bool) {
      (bool success, ) = address(predicty).call(abi.encodeWithSignature("createNewMarket()"));
      return success;
    }

    function withdrawWinnings(uint _marketId) public returns(bool) {
      (bool success, ) = address(predicty).call(abi.encodeWithSignature("withdrawWinnings(uint)", _marketId));
      return success;
    }

    function withdrawCreationReward(uint _marketId) public returns(bool) {
      (bool success, ) = address(predicty).call(abi.encodeWithSignature("withdrawCreationReward(uint)", _marketId));
      return success;
    }

    function withdrawSettlementReward(uint _marketId) public returns(bool) {
      (bool success, ) = address(predicty).call(abi.encodeWithSignature("withdrawSettlementReward(uint)", _marketId));
      return success;
    }

    // function placeItemForSale(string memory _item, uint _price) public returns(bool) {
    //     (bool success, ) = address(supplychain).call(abi.encodeWithSignature("addItem(string,uint256)",_item,_price));
    //     return success;
    // }
    //
    // function purchaseItem(uint _sku, uint _offer) public payable returns(bool) {
    //     (bool success, ) = address(supplychain).call{gas: 1000000, value: _offer}(abi.encodeWithSignature("buyItem(uint256)",_sku));
    //     return success;
    // }
    //
    // function shipItem(uint _sku) public returns(bool) {
    //     (bool success, ) = address(supplychain).call(abi.encodeWithSignature("shipItem(uint256)",_sku));
    //     return success;
    // }
    //
    // function receiveItem(uint _sku) public returns(bool) {
    //     (bool success, ) = address(supplychain).call(abi.encodeWithSignature("receiveItem(uint256)",_sku));
    //     return success;
    // }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    fallback() external payable {}

    receive() external payable {}

}
