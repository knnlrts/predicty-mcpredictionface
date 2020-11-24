# Avoiding common attacks

## Re-entracy Attacks

## Transaction Ordering and Timestamp Dependence

## Integer Overflow and Underflow
In order to protect against the potential security breaches caused by integer overflow and underflow, Predicty McPredictionFace relies on the SafeMath.sol library from OpenZeppelin. 


```
  ...
  
  using SafeMath for *;
  
  ...
  
  function placeBet(Option _option) external payable onlyLive(marketCount) {
    Market storage m = markets[marketCount];
    require(msg.value > 0,"=== Your bet should be greater than 0 ===");

    uint _predictionStake = msg.value;
    uint _commissionStake = _calculatePercentage(commissionPercentage, _predictionStake, 1000);
    commissionAmount = commissionAmount.add(_commissionStake);
    _predictionStake = _predictionStake.sub(_commissionStake);

    m.totalBets[_option] = m.totalBets[_option].add(_predictionStake);
    m.users[msg.sender].amountStaked[_option] = m.users[msg.sender].amountStaked[_option].add(_predictionStake);
    m.totalPool = m.totalPool.add(_predictionStake);

    emit LogBetPlaced(marketCount, msg.sender, _option, _predictionStake);
  }
  
  ...
```

## Denial of Service with Failed Call

## Denial of Service by Block Gas Limit or startGas

## Sending Ether
Predicty McPredictionFace only allows sending Ether into the contract via the dedicated functions. Therefore, both the fallback() and receive() functions implement a revert() statement.

```
  ...

  fallback () external payable {
    revert("=== Please use the dedicated functions to place bets and/or transfer ether into this smart contract ===");
  }

  receive() external payable {
    revert("=== Please use the dedicated functions to place bets and/or transfer ether into this smart contract ===");
  }
  
  ...
```
