const Predicty = artifacts.require("Predicty.sol");
const MockChainLinkOracle = artifacts.require("MockChainLinkOracle.sol");
const {
  BN,           // Big Number support
  balance,      // balance inspection support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time,         // Assertions for time manipulation
} = require("@openzeppelin/test-helpers");

const Option = {
  Bullish: 0,
  Neutral: 1,
  Bearish: 2
};

const MarketStatus = {
  Live: 0,
  InSettlement: 1,
  Settled: 2
};

contract("Predicty", (accounts) => {

    let [owner, gambler1, gambler2, gambler3, gambler4, gambler5, gambler6, _] = accounts;
    let predicty;
    let oracle;

    beforeEach(async () => {
        oracle = await MockChainLinkOracle.new();
        predicty = await Predicty.new(oracle.address, 3600);
    });

    it("should work with multiple gamblers", async() => {
        await time.increase(60);
        let status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Live, "the prediction market is not live");

        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        let amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler1, Option.Bullish);
        assert.equal(amountStakedOnBet, web3.utils.toWei("1.98"));

        await time.increase(60);
        await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler2, Option.Neutral);
        assert.equal(amountStakedOnBet, web3.utils.toWei("0.99"));

        await time.increase(60);
        await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler3, Option.Bearish);
        assert.equal(amountStakedOnBet, web3.utils.toWei("3.96"));

        await time.increase(60);
        await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler4, Option.Neutral);
        assert.equal(amountStakedOnBet, web3.utils.toWei("0.99"));

        await time.increase(60);
        await predicty.placeBet(Option.Neutral, {from: gambler5, value: web3.utils.toWei("1")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler5, Option.Neutral);
        assert.equal(amountStakedOnBet, web3.utils.toWei("0.99"));
        let commissionAmount = await predicty.commissionAmount();
        assert.equal(commissionAmount, web3.utils.toWei("0.09"));

        await time.increase(60);
        await expectRevert(predicty.withdrawWinnings(0, {from: gambler5}), "=== The prediction market must be settled to execute this function ===");

        await time.increase(3600);
        status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");

        await time.increase(60);
        await expectRevert(predicty.placeBet(Option.Bullish, {from: gambler3, value: web3.utils.toWei("3")}), "=== The prediction market must be live to call this function ===");
        await expectRevert(predicty.settleMarket({from: gambler1}), "=== The prediction market cannot be settled yet :( ===");
        await expectRevert(predicty.createNewMarket({from: gambler1}), "=== The prediction market must be settled to execute this function ===");

        await time.increase(3600);
        await predicty.settleMarket({from: gambler1});
        status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
        let settlementReward = await predicty.getUserSettlementReward(0, gambler1);
        assert.equal(settlementReward, web3.utils.toWei("0.009"));
        commissionAmount = await predicty.commissionAmount();
        assert.equal(commissionAmount, web3.utils.toWei("0.081"));

        await time.increase(60);
        await expectRevert(predicty.withdrawWinnings(0, {from: gambler1}), "=== You have no bets on the winning option :( ===");
        await expectRevert(predicty.withdrawWinnings(0, {from: gambler3}), "=== You have no bets on the winning option :( ===");
        await expectRevert(predicty.withdrawWinnings(0, {from: gambler6}), "=== You have no bets on the winning option :( ===");

        await time.increase(60);
        let balanceBefore = await balance.current(gambler1, "wei");
        await predicty.withdrawSettlementReward(0, {from: gambler1});
        let balanceAfter = await balance.current(gambler1, "wei");
        assert(balanceAfter.sub(balanceBefore) < new BN(web3.utils.toWei("0.009")));

        await time.increase(60);
        balanceBefore = await balance.current(gambler2, "wei");
        await predicty.withdrawWinnings(0, {from: gambler2});
        balanceAfter = await balance.current(gambler2, "wei");
        assert(balanceAfter.sub(balanceBefore) < new BN(web3.utils.toWei("2.97")));

        await time.increase(60);
        await predicty.createNewMarket({from: gambler2});
        status = await predicty.getMarketStatus(1);
        assert.equal(status, MarketStatus.Live, "the prediction market is not live");
        let creationReward = await predicty.getUserCreationReward(1, gambler2);
        assert.equal(creationReward, web3.utils.toWei("0.0081"));
        commissionAmount = await predicty.commissionAmount();
        assert.equal(commissionAmount, web3.utils.toWei("0.0729"));

    });

    it("should work when a gambler places a bet during a live prediction market", async() => {
        let eventEmitted = false;
        const result = await predicty.placeBet(
            Option.Bullish,
            {from: gambler1, value: web3.utils.toWei("2")}
        );
        const amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler1, Option.Bullish);
        const commissionAmount = await predicty.commissionAmount();
        const status = await predicty.getMarketStatus(0);
        if (result.logs[0].event == "LogBetPlaced") {
            eventEmitted = true;
        }
        assert.equal(status, MarketStatus.Live, "the prediction market is not live");
        assert.equal(eventEmitted, true, "placing a bet did not emit a LogBetPlaced event");
        assert.equal(amountStakedOnBet, web3.utils.toWei("1.98"), "the wei amount staked on the bet does not match the expected value (staked amount minus 10% commission)");
        assert.equal(commissionAmount, web3.utils.toWei("0.02"), "the commission amount in the smart contract does not match the expected value");
    });

    it("should error when a gambler places a bet during a prediction market that is in settlement", async() => {
        await time.increase(3660);
        const status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");
        await expectRevert(predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")}), "=== The prediction market must be live to call this function ===");
    });

    it("should error when a gambler places a bet during a settled prediction market", async() => {
        await time.increase(7260);
        await predicty.settleMarket();
        const status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
        await expectRevert(predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")}), "=== The prediction market must be live to call this function ===");
    });

    it("should error when gambler places a bet of 0 wei", async() => {
        await expectRevert(predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("0")}), "=== Your bet should be greater than 0 ===");
    });

    it("should work when a gambler triggers market settlement during a prediction market that is in settlement and past expire time", async() => {
        let eventEmitted = false;
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(7260); // past expire time
        let status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");
        const result = await predicty.settleMarket({from: gambler2});
        status = await predicty.getMarketStatus(0);
        if (result.logs[0].event == "LogResultPosted") {
            eventEmitted = true;
        }
        assert.equal(eventEmitted, true, "triggering market settlement did not emit a LogResultPosted event");
        assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
    });

    it("should error when a gambler triggers market settlement during a prediction market that is in settlement and NOT past expire time", async() => {
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(3660); // NOT past expire time
        let status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");
        await expectRevert(predicty.settleMarket({from: gambler2}), "=== The prediction market cannot be settled yet :( ===");
    });

    it("should error when a gambler triggers market settlement during a live prediction market", async() => {
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(60);
        const status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Live, "the prediction market is not live");
        await expectRevert(predicty.settleMarket({from: gambler2}), "=== The prediction market must be in settlement to call this function ===");
    });

    it("should error when a gambler triggers market settlement during an already settled prediction market", async() => {
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(7260);
        await predicty.settleMarket({from: gambler1});
        const status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
        await expectRevert(predicty.settleMarket({from: gambler2}), "=== The prediction market must be in settlement to call this function ===");
    });

    it("should work when a gambler creates a new prediction market after the previous one was settled", async() => {
        let eventEmitted = false;
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(7260);
        await predicty.settleMarket({from: gambler2});
        let status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
        await time.increase(60);
        const result = await predicty.createNewMarket({from: gambler3});
        if (result.logs[0].event == "LogNewMarketCreated") {
            eventEmitted = true;
        }
        assert.equal(eventEmitted, true, "creating a new market did not emit a LogNewMarketCreated event");
        status = await predicty.getMarketStatus(1);
        assert.equal(status, MarketStatus.Live, "the prediction market is not live");
    });

    it("should error when a gambler creates a new prediction market during an already running prediction market that is live", async() => {
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(60);
        const status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Live, "the prediction market is not live");
        await expectRevert(predicty.createNewMarket({from: gambler2}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should error when a gambler creates a new prediction market during an already running prediction market that is in settlement", async() => {
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        await time.increase(3660);
        const status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");
        await expectRevert(predicty.createNewMarket({from: gambler2}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should work when a winning gambler withdraws winnings after the prediction market was settled", async() => {
        let eventEmitted = false;
        await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
        let amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler1, Option.Bullish);
        assert.equal(amountStakedOnBet, web3.utils.toWei("1.98"));

        await time.increase(60);
        await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler2, Option.Neutral);
        assert.equal(amountStakedOnBet, web3.utils.toWei("0.99"));

        await time.increase(60);
        await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler3, Option.Bearish);
        assert.equal(amountStakedOnBet, web3.utils.toWei("3.96"));

        await time.increase(60);
        await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});
        amountStakedOnBet = await predicty.getUserAmountStaked(0, gambler4, Option.Neutral);
        assert.equal(amountStakedOnBet, web3.utils.toWei("0.99"));

        await time.increase(7260);
        await predicty.settleMarket({from: gambler2});
        let status = await predicty.getMarketStatus(0);
        assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");

        await time.increase(60);
        const balanceBefore = await balance.current(gambler2, "wei");
        const result = await predicty.withdrawWinnings(0, {from: gambler2});
        const balanceAfter = await balance.current(gambler2, "wei");
        assert(balanceAfter.sub(balanceBefore) < new BN(web3.utils.toWei("3.96")));
        if (result.logs[0].event == "LogWinningsClaimed") {
            eventEmitted = true;
        }
        assert.equal(eventEmitted, true, "withdrawal of bet winnings did not emit a LogWinningsClaimed event");
    });

    it("should error when a winning gambler tries to withdraw winnings twice", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
      await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});

      await time.increase(7260);
      await predicty.settleMarket({from: gambler2});
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");

      await time.increase(60);
      await predicty.withdrawWinnings(0, {from: gambler2});

      await time.increase(60);
      await expectRevert(predicty.withdrawWinnings(0, {from: gambler2}), "=== You already claimed your winnings for this market :( ===");
    });

    it("should error when a losing gambler tries to withdraw winnings", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
      await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});

      await time.increase(7260);
      await predicty.settleMarket({from: gambler2});
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");

      await time.increase(60);
      await expectRevert(predicty.withdrawWinnings(0, {from: gambler1}), "=== You have no bets on the winning option :( ===");
    });

    it("should error when a gambler that did not bet in the prediction market tries to withdraw winnings", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
      await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});

      await time.increase(7260);
      await predicty.settleMarket({from: gambler2});
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");

      await time.increase(60);
      await expectRevert(predicty.withdrawWinnings(0, {from: gambler5}), "=== You have no bets on the winning option :( ===");
    });

    it("should error when a gambler tries to withdraw winnings from a live prediction market", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
      await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});

      await time.increase(60);
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Live, "the prediction market is not live");
      await expectRevert(predicty.withdrawWinnings(0, {from: gambler2}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should error when a gambler tries to withdraw winnings from a prediction market that is in settlement", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei("4")});
      await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei("1")});

      await time.increase(3660);
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");
      await expectRevert(predicty.withdrawWinnings(0, {from: gambler4}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should work when a prediction market creator withdraws the creation reward after prediction market settlement", async() => {
      let eventEmitted = false;
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      let commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.01")); // 1% commission of total bet amount staked

      await time.increase(7260);
      await predicty.settleMarket({from: gambler3}); // 10% reward of current commission amount
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
      let settlementReward = await predicty.getUserSettlementReward(0, gambler3);
      assert.equal(settlementReward, web3.utils.toWei("0.001"));
      commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.009"));

      await time.increase(60);
      await predicty.createNewMarket({from: gambler4}); // 10% reward of current commission amount
      let creationReward = await predicty.getUserCreationReward(1, gambler4);
      assert.equal(creationReward, web3.utils.toWei("0.0009"));
      commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.0081"));

      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.0181"));
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3}); // 10% reward of current commission amount
      settlementReward = await predicty.getUserSettlementReward(1, gambler3);
      assert.equal(settlementReward, web3.utils.toWei("0.00181"));
      commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.01629"));
      status = await predicty.getMarketStatus(1);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");

      await time.increase(60);
      const balanceBefore = await balance.current(gambler4, "wei");
      const result = await predicty.withdrawCreationReward(1, {from: gambler4});
      const balanceAfter = await balance.current(gambler4, "wei");
      assert(balanceAfter.sub(balanceBefore) < new BN(web3.utils.toWei("0.0009")));
      if (result.logs[0].event == "LogCreationRewardClaimed") {
          eventEmitted = true;
      }
      assert.equal(eventEmitted, true, "withdrawal of creation reward did not emit a LogCreationRewardClaimed event");
    });

    it("should error when a prediction market creator tries to withdraw the creation reward twice", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3});
      await time.increase(60);
      await predicty.createNewMarket({from: gambler4});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3});
      await time.increase(60);
      await predicty.withdrawCreationReward(1, {from: gambler4});

      await expectRevert(predicty.withdrawCreationReward(1, {from: gambler4}), "=== You already claimed your creation reward for this market :( ===");
    });

    it("should error when a gambler that did NOT create the prediction market tries to withdraw the creation reward", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3});
      await time.increase(60);
      await predicty.createNewMarket({from: gambler4});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3});
      await time.increase(60);

      await expectRevert(predicty.withdrawCreationReward(1, {from: gambler3}), "=== You did not create this market ===");
    });

    it("should error when a prediction market creator tries to withdraw the creation reward from a live prediction market", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3});
      await time.increase(60);
      await predicty.createNewMarket({from: gambler4});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await time.increase(60);
      status = await predicty.getMarketStatus(1);
      assert.equal(status, MarketStatus.Live, "the prediction market is not live");

      await expectRevert(predicty.withdrawCreationReward(1, {from: gambler4}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should error when a prediction market creator tries to withdraw the creation reward from a prediction market that is in settlement", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3});
      await time.increase(60);
      await predicty.createNewMarket({from: gambler4});
      await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei("1")});
      await time.increase(3660);
      status = await predicty.getMarketStatus(1);
      assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");

      await expectRevert(predicty.withdrawCreationReward(1, {from: gambler4}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should work when a prediction market settler withdraws the settlement reward after prediction market settlement", async() => {
      let eventEmitted = false;
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      let commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.01")); // 1% commission of total bet amount staked

      await time.increase(7260);
      await predicty.settleMarket({from: gambler3}); // 10% reward of current commission amount
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");
      let settlementReward = await predicty.getUserSettlementReward(0, gambler3);
      assert.equal(settlementReward, web3.utils.toWei("0.001"));
      commissionAmount = await predicty.commissionAmount();
      assert.equal(commissionAmount, web3.utils.toWei("0.009"));

      await time.increase(60);
      const balanceBefore = await balance.current(gambler3, "wei");
      const result = await predicty.withdrawSettlementReward(0, {from: gambler3});
      const balanceAfter = await balance.current(gambler3, "wei");
      assert(balanceAfter.sub(balanceBefore) < new BN(web3.utils.toWei("0.001")));
      if (result.logs[0].event == "LogSettlementRewardClaimed") {
          eventEmitted = true;
      }
      assert.equal(eventEmitted, true, "withdrawal of settlement reward did not emit a LogSettlementRewardClaimed event");
    });

    it("should error when a prediction market settler tries to withdraw the settlement reward twice", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3}); // 10% reward of current commission amount
      await time.increase(60);
      await predicty.withdrawSettlementReward(0, {from: gambler3});

      await time.increase(60);
      await expectRevert(predicty.withdrawSettlementReward(0, {from: gambler3}), "=== You already claimed your settlement reward for this market :( ===");
    });

    it("should error when a gambler that did NOT settle the prediction market tries to withdraw the settlement reward", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(7260);
      await predicty.settleMarket({from: gambler3}); // 10% reward of current commission amount

      await time.increase(60);
      await expectRevert(predicty.withdrawSettlementReward(0, {from: gambler5}), "=== You did not settle this market ===");
    });

    it("should error when a prediction market settler tries to withdraw the settlement reward from a live prediction market", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(60);
      status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Live, "the prediction market is not live");

      await expectRevert(predicty.withdrawSettlementReward(0, {from: gambler3}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should error when a prediction market settler tries to withdraw the settlement reward from a prediction market that is in settlement", async() => {
      await predicty.placeBet(Option.Neutral, {from: gambler1, value: web3.utils.toWei("1")});
      await time.increase(3660);
      status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.InSettlement, "the prediction market is not in settlement");

      await expectRevert(predicty.withdrawSettlementReward(0, {from: gambler3}), "=== The prediction market must be settled to execute this function ===");
    });

    it("should error when a gambler tries to create a new prediction market after the smart contract owner paused market creation", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await time.increase(60);
      await predicty.pauseMarketCreation({from: owner});
      const paused = await predicty.marketCreationPaused();
      assert.equal(paused, true, "prediction market creation is not paused");
      await time.increase(7260);
      await predicty.settleMarket({from: gambler2});
      let status = await predicty.getMarketStatus(0);
      assert.equal(status, MarketStatus.Settled, "the prediction market is not settled");

      await time.increase(60);
      await expectRevert(predicty.createNewMarket({from: gambler3}), "=== The owner has paused market creation ===");
    });

    it("should error when a gambler tries to pause prediction market creation", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await time.increase(60);
      await expectRevert(predicty.pauseMarketCreation({from: gambler2}), "=== Only the owner address can call this function ===");
      const paused = await predicty.marketCreationPaused();
      assert.equal(paused, false, "prediction market creation is not paused");
    });

    it("should error when a gambler tries to update the oracle price feed address", async() => {
      await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei("2")});
      await time.increase(60);
      await expectRevert(predicty.updateOracleAddress(gambler2, {from: gambler2}), "=== Only the owner address can call this function ===");
    });

});
