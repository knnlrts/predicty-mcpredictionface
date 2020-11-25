# Avoiding common attacks

## Re-entracy Attacks
Predicty McPredictionFace tries to protect itself from re-entrancy attacks by avoiding that the caller can take over the control flow and end up calling smart contract functions again in a recursive manner. More specifically, this is done by implementing the withdrawal design pattern to separate the contract accounting logic and the transfer logic, as well as doing any internal work before making any external function calls. 

For example: 
* The calculateWinnings() function takes care of calculating the winnings and the withdrawWinnings() function takes care transferring the calculated winnings (if any) to the caller.
* Internal work such as keeping state by tracking whether an address has claimed their winnings is done before the actual transfer of assets.

```
  ...
  
  function calculateWinnings(uint _marketId, address _user) public view returns(uint winnings) {
    Market storage m = markets[_marketId];
    uint winningBet = m.users[_user].amountStaked[m.winningOption];
    uint winningTotal = m.totalBets[m.winningOption];
    uint loserPool = m.totalPool.sub(winningTotal);
    winnings = loserPool.mul(winningBet).div(winningTotal);
    winnings = winnings.add(winningBet);

    return winnings;
  }
  
  function withdrawWinnings(uint _marketId) external onlySettled(_marketId) {
    Market storage m = markets[_marketId];
    require(m.users[msg.sender].claimedWinnings == false, "=== You already claimed your winnings for this market :( ===");

    uint winningBet = m.users[msg.sender].amountStaked[m.winningOption];
    require(winningBet > 0, "=== You have no bets on the winning option :( ===");

    uint winnings = calculateWinnings(_marketId, msg.sender);

    m.users[msg.sender].claimedWinnings = true;
    msg.sender.transfer(winnings);

    emit LogWinningsClaimed(_marketId, msg.sender, winnings);
  }
  
  ...
```

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
