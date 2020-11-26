# Design pattern decisions

## Fail Early and Loud
Predicty McPredictionFace implements several require() statements, checking the condition(s) required for execution as early as possible and throwing an exception if the condition is not met. This also reduces unnecessary code execution in the event that an exception will be thrown eventually.

## Restricting Access / Access Control
Predicty McPredictionFace restricts function access so that only specific addresses are permitted to execute certains functions. For example, only the owner can update the pricefeed oracle, pause market creation or destroy the smart contract.

```
  ...
  
  modifier onlyOwner() {
    require(msg.sender == owner, "=== Only the owner address can call this function ===");
    _;
  }
  
  function updateOracleAddress(address _oracle) external onlyOwner {
    oracle = _oracle;
  }

  function pauseMarketCreation() external onlyOwner {
    require(!marketCreationPaused);
    marketCreationPaused = true;
  }
  
  ...

```

## Mortal
Predicty McPredictionFace includes functionality to destroy the smart contract and completely remove it from the blockchain (using the selfdestruct keyword). The destroy() function call destroys the smart contract instance and sends all remaining Ether stored in the smart contract to the owner address. As this is an irreversible action, access to this function is restricted to the owner only.

```
  ...
  
  function destroy() public onlyOwner {
    selfdestruct(owner);
  }
  
  ...

```

## Withdrawal Pattern
Predicty McPredictionFace clearly separates function logic. For example: the calculateWinnings() function handles the accounting and calculates the reward for a winning player. Another function, withdrawWinnings(), allows winning players to claim their reward and transfer them from the smart contract to their account. This pattern protects against re-entrancy and denial of service attacks.

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

## Circuit Breaker
Predicty McPredictionFace implements a circuit breaker design pattern that allows the creation of new prediction markets to be stopped. This allows the owner to pause the contract in case a bug has been detected.
```
  ...
  
  bool public marketCreationPaused;
  
  function pauseMarketCreation() external onlyOwner {
    require(!marketCreationPaused);
    marketCreationPaused = true;
  }
  
  function resumeMarketCreation() external onlyOwner {
    require(marketCreationPaused);
    marketCreationPaused = false;
  }
  
  function createNewMarket() public onlySettled(marketCount) returns(bool success) {
    require(!marketCreationPaused, "=== The owner has paused market creation ===");
    ...
  }
  
  ...
```

## State Machine
Prediction markets created on the Predicty McPredictionFace smart contract have different states in which they differently and different functions can be called.

For example: 
* The settleMarket() function call ends the "In Settlement" stage and moves the contract to the next stage: "Settled". 
* Players can only place bets in the "Live" stage. 
* The prediction market can only be settled, once the market settlement time has been reached.

```
  ...
  
  enum MarketStatus {
    Live,
    InSettlement,
    Settled
  }
  
  modifier onlyLive(uint _marketId) {
    require(getMarketStatus(_marketId) == MarketStatus.Live, "=== The prediction market must be live to call this function ===");
    _;
  }

  modifier onlyInSettlement(uint _marketId) {
    require(getMarketStatus(_marketId) == MarketStatus.InSettlement, "=== The prediction market must be in settlement to call this function ===");
    require(block.timestamp > getMarketSettleTime(_marketId), "=== The prediction market cannot be settled yet :( ===");
    _;
  }

  modifier onlySettled(uint _marketId) {
    require(getMarketStatus(_marketId) == MarketStatus.Settled, "=== The prediction market must be settled to execute this function ===");
    _;
  }
  
  function placeBet(Option _option) external payable onlyLive(marketCount) { ... }
  
  function settleMarket() external onlyInSettlement(marketCount) {
    ...
    m.state = MarketStatus.Settled;
  }
  
  ...
```
