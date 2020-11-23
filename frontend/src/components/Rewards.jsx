import React, { useState, useEffect }  from "react";
import { ethers } from "ethers";
import getBlockchain from '../ethereum.js';

function Rewards() {

  const [predicty, setPredicty] = useState(undefined);
  const [markets, setMarkets] = useState(undefined);

  useEffect(() => {
    const getInfo = async () => {
      const { signerAddress, predicty } = await getBlockchain();
      const marketCount = await predicty.marketCount();

      const markets = [];

      for (let i = 0; i < Number(marketCount); i++) {
        const marketInfo = await Promise.all([
          predicty.getMarketStartTime(i),
          predicty.getMarketSettleTime(i),
          predicty.getWinningOption(i),
          predicty.calculateWinnings(i, signerAddress),
          predicty.getUserClaimedWinnings(i, signerAddress),
          predicty.getUserCreationReward(i, signerAddress),
          predicty.getUserClaimedCreationReward(i, signerAddress),
          predicty.getUserSettlementReward(i, signerAddress),
          predicty.getUserClaimedSettlementReward(i, signerAddress),
        ]);
        markets.push(
          {
            id: i,
            name: "What will be the price of ETH/USD at " + new Date(Number(marketInfo[1].toString())*1000).toUTCString() + " ?",
            creationTime: new Date(Number(marketInfo[0].toString())*1000).toUTCString(),
            settlementTime: new Date(Number(marketInfo[1].toString())*1000).toUTCString(),
            winningOption: marketInfo[2],
            winnings: ethers.utils.formatUnits(marketInfo[3], "ether"),
            claimedWinnings: marketInfo[4],
            creationReward: ethers.utils.formatUnits(marketInfo[5], "ether"),
            claimedCreationReward: marketInfo[6],
            settlementReward: ethers.utils.formatUnits(marketInfo[7], "ether"),
            claimedSettlementReward: marketInfo[8],
          }
        );
      }

      setPredicty(predicty);
      setMarkets(markets);

      // console.log(markets);

    }

    getInfo();

  }, [markets]);

  if(typeof predicty === "undefined"
    || typeof markets === "undefined"
  ) {
    return (<div><h4 className='text-center font-weight-light my-4'>Loading blockchain states...</h4></div>);
  }

  const withdrawWinnings = async(market) => {
    await predicty.withdrawWinnings(market);
  }

  const withdrawCreationReward = async(market) => {
    await predicty.withdrawCreationReward(market);
  }

  const withdrawSettlementReward = async(market) => {
    await predicty.withdrawSettlementReward(market);
  }

  // console.log(markets);

  function renderWinningsData() {
      return markets.map((market, index) => {
      const { id, name, creationTime, settlementTime, winningOption, winnings, claimedWinnings, creationReward, claimedCreationReward, settlementReward, claimedSettlementReward } = market
      if (!claimedWinnings && Number(winnings) != 0) {
        return (
          <tr>
            <th scope="row">{name}</th>
            <td>{winningOption === 0 ? "Bullish 🚀" : "" }{winningOption === 1 ? "Neutral 🤷‍♂️": "Bearish 🐻"}</td>
            <td>{winnings} (ether)</td>
            <td><button type="button" className="btn btn-success" onClick={e => withdrawWinnings(id)}>Claim</button></td>
          </tr>
        )
      }
    })
  }

  function renderCreationData() {
      return markets.map((market, index) => {
      const { id, name, creationTime, settlementTime, winningOption, winnings, claimedWinnings, creationReward, claimedCreationReward, settlementReward, claimedSettlementReward } = market
      if (!claimedCreationReward && creationReward != 0) {
        return (
          <tr>
            <th scope="row">{name}</th>
            <td>{creationTime}</td>
            <td>{creationReward} (ether)</td>
            <td><button type="button" className="btn btn-success" onClick={e => withdrawCreationReward(id)}>Claim</button></td>
          </tr>
        )
      }
    })
  }

  function renderSettlementData() {
    return markets.map((market, index) => {
      const { id, name, creationTime, settlementTime, winningOption, winnings, claimedWinnings, creationReward, claimedCreationReward, settlementReward, claimedSettlementReward } = market
      if (!claimedSettlementReward && settlementReward != 0) {
        return (
          <tr>
            <th scope="row">{name}</th>
            <td>{settlementTime}</td>
            <td>{settlementReward} (ether)</td>
            <td><button type="button" className="btn btn-success" onClick={e => withdrawSettlementReward(id)}>Claim</button></td>
          </tr>
        )
      }
    })
  }

  return (
    <div className="rewards">
      <div className="container">

        <div className="row align-items-center my-5">
          <h2 className="font-weight-light">Claim your rewards here!</h2>
        </div>

        <div>

          <div className="row align-items-center my-2">
            <h4 className="font-weight-light">Prediction market bets won</h4>
          </div>

          <div className="row align-items-center">

            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Prediction market</th>
                  <th scope="col">Winning option</th>
                  <th scope="col">Total reward</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {!renderWinningsData().every((value) => typeof value === 'undefined') ? renderWinningsData() : <tr><td className='text-center' colspan='4'>It seems like you have claimed all your winning bets...</td></tr>}
              </tbody>
            </table>

          </div>

          <div className="row align-items-center my-2">
            <h4 className="font-weight-light">Prediction markets created</h4>
          </div>

          <div className="row align-items-center">

            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Prediction market</th>
                  <th scope="col">Creation time</th>
                  <th scope="col">Incentive</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {!renderCreationData().every((value) => typeof value === 'undefined') ? renderCreationData() : <tr><td className='text-center' colspan='4'>It seems like you have claimed all your market creation rewards...</td></tr>}
              </tbody>
            </table>

          </div>

          <div className="row align-items-center my-2">
            <h4 className="font-weight-light">Prediction markets settled</h4>
          </div>

          <div className="row align-items-center">

            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Prediction market</th>
                  <th scope="col">Settlement time</th>
                  <th scope="col">Incentive</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {!renderSettlementData().every((value) => typeof value === 'undefined') ? renderSettlementData() : <tr><td className='text-center' colspan='4'>It seems like you have claimed all your market settlement rewards...</td></tr>}
              </tbody>
            </table>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Rewards;
