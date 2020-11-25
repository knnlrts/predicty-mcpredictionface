# Predicty McPredictionFace: dapp, dapper, dappst!

This repo hosts my final project submission for the ConsenSys Blockchain Developer Online Bootcamp (2020 edition).

![Alt Text](https://media.giphy.com/media/c2pOELjarKcU/giphy.gif)

## What is Predicty McPredictionFace?
__Predicty McPredictionFace is a Solidity smart contract implementation of a prediction market that allows crypto and defi enthousiasts alike to predict the future USD value of ETH on an hourly time frame.__ The fundamental idea behind a prediction market is simple: it allows market participants to predict the outcome of an event and get rewarded if they are correct. When enough players participate, the prediction market can sum the opinions of the many and capture the "wisdom of the crowd", which can provide accurate forecasts and information in social and economic matters such as (digital) asset prices, politics, sports, etc. In order to showcase this, the frontend of Predicty McPredictionFace will continually display the total bet distribution of all players in the prediction market at any point in time.

## Why Predicty McPredictionFace?
Centralized prediction markets suffer a few drawbacks that reduce their overall effectiveness:  
* __Trust__: betting stakes are transferred to a central custodian and there is limited (if any) visibility on who else participated in the market, as well as their betting positions
* __Cost__: high transaction fees are often charged on market entry and reward distribution

Predicty McPredictionFace instead aims to offer a fair, decentralized, and open finance prediction market for hourly ETH/USD price prediction, settlement and reward distribution:
* __On-chain decentralized prediction market__ by means of a deployed smart contract, instead of a central intermediary
* __Instant position staking__, instead of low liquidity order books
* __Instant rewards and short market cycles__ (hourly) means that players do not need to lock in their funds for long durations and are able to claim their rewards, as soon as a prediction market result is out
* __A ChainLink oracle pricefeed__ for the ETH/USD price is leveraged to create and settle prediction markets automatically
* __Players are incentivized__ to perform new market creation and existing market settlement transactions to keep the prediction market cycle running and decentralized

## Solution overview

### Market creation
The contract owner creates the first prediction market round by deploying the smart contract. A new prediction market with a name like "What will be the price of ETH/USD at Mon, 23 Nov 2020 22:00:00 GMT ?" will be created, which allows players to stake ETH to predict the future USD value of ETH at the specified time. After the initial market has been settled, the market settlement page will display a button to create a new prediction market. While this market creation button is displayed, any willing player can sign the market creation transaction to create the next hourly prediction market. The player who clicked the button first, will be able to claim a market creation reward. Unlike other prediction markets, where markets are created by "market writers" or "option writers", Predicty McPredictionFace disintermediates the need for such writers, by replacing them with a smart contract and player incentives.

### Market length
* __Market start time__ = the time when a market becomes live and players can take positions in the prediction options that are offered.
* __Prediction expire time__ = the time when a market is no longer accepting predictions and is no longer live (awaiting closure to distribute rewards).
* __Market settlement time__ = the time when the market closes and the winning option can be declared based on the ChainLink oracle pricefeed input. 
The difference between the market start time and the prediction expire time is 1 hour, i.e. players can predict the market price for up to one hour, depending on the timestamp at which the market was created. The difference between the prediction expire time and the market settlment time is 1 hour. 

Example: 
* Market name: What will be the price of ETH/USD at Mon, 23 Nov 2020 22:00:00 GMT ?
* The market will become live at the earliest at **20:00:00 GMT** on 23/11/2020 and begin accepting predictions (market start time).
* The market will accept predictions until **21:00:00 GMT** on 23/11/2020 and then will no longer be live (prediction expire time).
* The market will close at **22:00:00 GMT** on 23/11/2020 and any player can perform the market settlement transaction to determine the winning outcome based on the oracle price feed at this particular time (market settlement time).
At any point in time, only 1 prediction market will be active for predictions.

### Option calculation
The prediction market offers players 3 betting options to take positions in the market (bullish, neutral, or bearish, each corresponding to a different price range, based on input from the ChainLink oracle pricefeed). The player will be rewarded if the actual price at the market settlement time is within the price range mentioned by the selected option. The option price ranges are calculated by the smart contract, using a simple and transparent algorithm before creating a new prediction market.

By default, users can take a position in 3 different market options:
* __Option 1 (Bullish)__: this option represents all prices above the upper limit of the neutral range.
* __Option 2 (Neutral)__: this option represents a range of price values which are equally distributed around the market price when the market becomes live.
* __Option 3 (Bearish)__: this option represents all prices below the lower limit of the neutral range.

### Option staking
Players can buy positions by staking an arbitrary amount of ETH (greater than 0 wei) on a specific betting option. Players can additionally stake on the same position if they want to take on more risk, or stake on other betting options in order to hedge their current bet, as long as the prediction market is live. By default, in case of an unsuccessful prediction, the player loses the full amount they staked to predict that outcome.

__Players will be charged a fee__ for participation in the prediction market:
* 1% of the transaction value when staking ETH on a betting option.
* All of the fees collected this way are placed in the smart contract for complete transparency and security.
* In order to create a new live market or to settle an existing market, a player needs to push the respective transaction on the ethereum blockchain. This will result in that player incurring the gas cost of the transaction.
* The fees collected will be used to incentivize players to perform market creation and market settlement transactions to keep the prediction market cycle going.
* The incentive is distributed in variable amounts (10% of the total fee pool). This is done so the incentives for prediction market creation and settlement scale together with the total number of players and betting amounts staked in the current and previous prediction markets. More players and higher bets mean better incentives.
* The reward will be earmarked and claimable by the address (player) who signed the transaction.
* Any left-over fees, apart from the market creator and market settlement incentives, are accrued in the smart contract.

### Market settlement
After the prediction market expires, the market settlement page will display a countdown until market settlement together with a button to settle the market. When the market settlement time is reached, any willing player can sign the market settlement transaction to settle the running prediction market. The player who clicked the button first, will be able to claim a market settlement reward. Once triggered, the prediction market will be settled using the ETH/USD pricefeed taken from a decentralized Chainlink oracle and on-chain smart contract computation. This ensures zero manual intervention and automated transparent settlements, while preventing volatility and single points of failure. At market settlement time, the actual ETH/USD market price is noted via the resolution mechanism (oracle) and the correct option is declared based on where in the different option ranges the noted price lies.

### Market reward claims
Once the prediction market has been settled, bet winnings are distributed from the market reward pool, which consists of all amounts staked in the losing options and will be distributed to among the players holding positions in the winning option, as their incentive for predicting accurately.

* __Reward computation for each player__: reward pool * (amount staked by the player in the winning option / total amount staked by all players in the winning option)

In order to provide more security and optimize gas costs, rewards will stay in the smart contract, where they can be subsequently claimed by the winning players. The rewards are claimable as soon as the market has been settled and upon a successful claim, the reward is transferred to the user's wallet. 

![Alt Text](https://media.giphy.com/media/l2SqgkzuiOQZKeLLi/giphy.gif)


## Getting Started

These instructions will get you a copy of this wild project up and running on your local machine for development and testing purposes. 

### Requirements
```
Node >= 10.19.0
Truffle >= v5.1.48 - a development framework for Ethereum
Ganache CLI >= v6.11.0
```

### Installing
Firstly, you need to clone this repo. You can do so by downloading the repo as a zip and unpacking or using the following git command
```
git clone https://github.com/knnlrts/predicty-mcpredictionface.git
```

Now, It's time to install the dependencies. Enter the predicty-mcpredictionface directory and use
```
npm install
```

Similarly, enter the frontend subdirectory and install the dependencies using
```
npm install
```

We need to compile the smart contracts before deploying.
```
truffle compile
```

Now, You should start a private network on port 8545 using Truffle develop, ganache-cli or something similar in a separate terminal window.
```
ganache-cli
```

If you want, you can run the test cases using
```
truffle test
```
  
Then, you can deploy the Predicty McPredictionFace contracts using 
```
truffle migrate
```
Note: the test cases use time-shifting test the smart contract functionality, so if you have ran the test cases first, the development blockchain timestamps will display a future datetime.

The development server for the frontend can be started on your local machine (http://localhost:3000/) using
```
npm run start
```

Note: the frontend may be buggy as I'm just starting out with React (tip: refresh a lot) and was only tested superficially with the Firefox web browser.

### Deployed Addresses - Rinkeby
* Predicty McPredictionFace smart contract: [0xF25eDE3d31e512ce5863874896771b3fBA27204e](https://rinkeby.etherscan.io/address/0xF25eDE3d31e512ce5863874896771b3fBA27204e)
* Owner: 0x6fe0b112e10959C2B11154792113c980F2adbdd4
* ChainLink ETH/USD oracle pricefeed: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
