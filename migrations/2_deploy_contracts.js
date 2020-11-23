const Predicty = artifacts.require("Predicty.sol");
const MockChainLinkOracle = artifacts.require("MockChainLinkOracle.sol");

const Option = {
  Bullish: 0,
  Neutral: 1,
  Bearish: 2
};

module.exports = async function(deployer, _network, addresses) {

  [admin, gambler1, gambler2, gambler3, gambler4, _] = addresses;

  await deployer.deploy(MockChainLinkOracle);
  const oracle = await MockChainLinkOracle.deployed();

  await deployer.deploy(Predicty, oracle.address, 3600)
  const predicty = await Predicty.deployed();

  await predicty.placeBet(Option.Bullish, {from: gambler1, value: web3.utils.toWei('4')});
  await predicty.placeBet(Option.Neutral, {from: gambler2, value: web3.utils.toWei('1')});
  await predicty.placeBet(Option.Bearish, {from: gambler3, value: web3.utils.toWei('2')});
  await predicty.placeBet(Option.Neutral, {from: gambler4, value: web3.utils.toWei('2')});

}
