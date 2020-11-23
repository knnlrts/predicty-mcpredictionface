import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import getBlockchain from '../ethereum.js';
import { Pie } from 'react-chartjs-2';
import TradingViewWidget from 'react-tradingview-widget';

const Option = {
  Bullish: 0,
  Neutral: 1,
  Bearish: 2
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

function Market() {

  const [marketStatus, setMarketStatus] = useState(0);
  const [marketSettleTime, setMarketSettleTime] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const { signerAddress, predicty } = await getBlockchain();
      const marketCount = await predicty.marketCount();
      const marketState = await predicty.getMarketStatus(marketCount);
      const marketExpire = await predicty.getMarketExpireTime(marketCount);
      const marketSettle = await predicty.getMarketSettleTime(marketCount);

      setPredicty(predicty);
      setMarketSettleTime(new Date(Number(marketSettle.toString())*1000));

      if (marketState === 0 && new Date() > new Date(Number(marketExpire.toString())*1000)) {
        setMarketStatus(1);
      } else {
        setMarketStatus(marketState);
      }

    };

    init();

  }, []);


  const calculateTimeLeft = (targetTime) => {
    let now = new Date();
    const difference = +targetTime - +now;
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    } else {
      timerComponents.push(
        <span>
          {timeLeft[interval]} {interval}{" "}
        </span>
      );
      if (marketStatus === 0 && timeLeft["hours"] == 0) {
        timerComponents.pop();
      }
      if (marketStatus === 0 && interval == "hours") {
        timerComponents.pop();
      }
    }
  });

  useEffect(() => {
    setTimeout(() => {
      setTimeLeft(calculateTimeLeft(marketSettleTime));
      // console.log(timerComponents.toString());
    }, 1000);
  });

  const [predicty, setPredicty] = useState(undefined);
  const [myBets, setMyBets] = useState(undefined);
  const [betPredictions, setBetPredictions] = useState(undefined);

  const [marketCount, setMarketCount] = useState(undefined);
  const [marketInfo, setMarketInfo] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const { signerAddress, predicty } = await getBlockchain();
      const marketCount = await predicty.marketCount();
      const myBets = await Promise.all([
        predicty.getUserAmountStaked(marketCount, signerAddress, Option.Bullish),
        predicty.getUserAmountStaked(marketCount, signerAddress, Option.Neutral),
        predicty.getUserAmountStaked(marketCount, signerAddress, Option.Bearish),
      ]);
      const bets = await Promise.all([
        predicty.getMarketTotalBets(marketCount, Option.Bullish),
        predicty.getMarketTotalBets(marketCount, Option.Neutral),
        predicty.getMarketTotalBets(marketCount, Option.Bearish),
      ]);
      const betPredictions = {
        labels: [
          'Bullish',
          'Neutral',
          'Bearish'
        ],
        datasets: [{
          data: [bets[0].toString(), bets[1].toString(), bets[2].toString()],
          backgroundColor: ['#63FFDD','#EFD27C','#FF6384'],
          hoverBackgroundColor: ['#63FFDD','#EFD27C','#FF6384'],
        }]
      };
      const marketInfo = await Promise.all([
        predicty.getMarketStatus(marketCount),
        predicty.getMarketStartTime(marketCount),
        predicty.getMarketExpireTime(marketCount),
        predicty.getMarketSettleTime(marketCount),
        predicty.getNeutralMinValue(marketCount),
        predicty.getNeutralMaxValue(marketCount),
        predicty.markets(marketCount),
        predicty.marketCount(),
        predicty.getWinningOption(marketCount),
        predicty.getMarketTotalPool(marketCount),
      ]);

      setPredicty(predicty);
      setMyBets(myBets);
      setBetPredictions(betPredictions);

      setMarketCount(marketCount);
      setMarketInfo(marketInfo);

      console.log(marketInfo.toString());

    };

    init();

  }, [myBets]);

  if(typeof predicty === "undefined"
    || typeof myBets === "undefined"
    || typeof betPredictions === "undefined"
    || typeof marketInfo === "undefined"
    || typeof marketCount === "undefined"
  ) {
    return (<div><h4 className='text-center font-weight-light my-4'>Loading blockchain states...</h4></div>);
  }

  const placeBet = async(option, e) => {
    e.preventDefault();
    await predicty.placeBet(option, {value: e.target.elements[0].value});
  };

  const settleMarket = async() => {
    await predicty.settleMarket();
  };

  const createNewMarket = async() => {
    await predicty.createNewMarket();
  };

  const tradingViewData = {
    "width": 980,
    "height": 610,
    "symbol": "KRAKEN:ETHUSD",
    "interval": "60",
    "timezone": "Etc/UTC",
    "theme": "light",
    "style": "1",
    "locale": "en",
    "toolbar_bg": "#f1f3f6",
    "enable_publishing": false,
    "withdateranges": true,
    "allow_symbol_change": true,
    "studies": ["MASimple@tv-basicstudies"],
    "container_id": "tradingview_f1538"
  };

  return (
    <div className="market">
      <div className="container">

      {(() => {
          if (marketStatus === 0) {

            return (
              <div>

                <h2 className='text-center font-weight-light my-4'>Prediction market live!</h2>

                <h2 className='text-center my-4'><em>What will be the price of ETH/USD at {new Date(Number(marketInfo[3].toString())*1000).toUTCString()} ?</em></h2>

                <h4 className='text-center font-weight-light my-4'><strong>{timerComponents.length ? timerComponents : <span>Time's up!</span>}{timerComponents.length ? <span> left to place your bets!</span> : <span> This market is now closed for betting.</span>}</strong></h4>

                <div className='row align-items-center my-2 p-3 mb-2 bg-light text-dark'>

                  <div className='col-sm-8'>
                    <h3 className='text-center font-weight-light'>Current bet distribution by market participants</h3>
                    <div>
                      <Pie data={betPredictions}/>
                    </div>
                  </div>

                  <div className="col-sm-4">

                    <div className='row my-2'>
                      <div className='card text-center'>
                        <div className='card-body'>
                          <h5 className='card-title'>Option 1: Bullish 🚀</h5>
                          <p>Higher than {formatter.format(Number(marketInfo[5])/100000000)}</p>
                          <form className='form-inline' onSubmit={e => placeBet(Option.Bullish, e)}>
                            <input type='text' className='form-control mr-sm-2' placeholder='Bet amount (wei)'/>
                            <button type='submit' className='btn btn-primary'>Place bet</button>
                          </form>
                        </div>
                      </div>
                    </div>
                    <div className='row my-2'>
                      <div className='card text-center'>
                        <div className='card-body'>
                          <h5 className='card-title'>Option 2: Neutral 🤷‍♂️</h5>
                          <p>Between {formatter.format(Number(marketInfo[4])/100000000)} and {formatter.format(Number(marketInfo[5])/100000000)}</p>
                          <form className='form-inline' onSubmit={e => placeBet(Option.Neutral, e)}>
                            <input type='text' className='form-control mr-sm-2' placeholder='Bet amount (wei)'/>
                            <button type='submit' className='btn btn-primary'>Place bet</button>
                          </form>
                        </div>
                      </div>
                    </div>
                    <div className='row my-2'>
                      <div className='card text-center'>
                        <div className='card-body'>
                          <h5 className='card-title'>Option 3: Bearish 🐻</h5>
                          <p>Lower than {formatter.format(Number(marketInfo[4])/100000000)}</p>
                          <form className='form-inline' onSubmit={e => placeBet(Option.Bearish, e)}>
                            <input type='text' className='form-control mr-sm-2' placeholder='Bet amount (wei)'/>
                            <button type='submit' className='btn btn-primary'>Place bet</button>
                          </form>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                <h3 className='font-weight-light text-center my-4'>Your current bets in this market</h3>
                <h5 className='font-weight-light text-center'>Bullish 🚀: <strong>{myBets[0].toString()} (wei)</strong></h5>
                <h5 className='font-weight-light text-center'>Neutral 🤷‍♂️: <strong>{myBets[1].toString()} (wei)</strong>‍</h5>
                <h5 className='font-weight-light text-center'>Bearish 🐻: <strong>{myBets[2].toString()} (wei)</strong></h5>

              </div>
            )
          } else if (marketStatus === 1) {
            return (
              <div>

                <h2 className='text-center font-weight-light my-4'>Prediction market in settlement...</h2>

                <h2 className='text-center my-4'><em>What will be the price of ETH/USD at {marketSettleTime.toUTCString()} ?</em></h2>

                <h4 className='text-center font-weight-light my-4'><strong>{timerComponents.length ? timerComponents : <span>Time's up!</span>}{timerComponents.length ? <span> left until this market can be settled!</span> : <span> This market can now be settled.</span>}</strong></h4>

                <div className='row align-items-center my-2 p-3 mb-2 bg-light text-dark'>

                  <div className='col-sm-7'>
                    <p className='lead text-center'>Total bet distribution by market participants:</p>
                    <div>
                      <Pie data={betPredictions}/>
                    </div>
                  </div>

                  <div className='col-sm-5'>
                    <div className='row'>
                      <div className='card text-center'>
                        <div className='card-body'>
                          <h5 className='card-title'>Settle this market</h5>
                          <p>When the time is up, click the button below to call the default ChainLink pricefeed oracle and settle this market.</p>
                          <button type='submit' className='btn btn-success' onClick={e => settleMarket()}>Settle market</button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <h3 className='font-weight-light text-center my-4'>Your current bets in this market</h3>
                <h5 className='font-weight-light text-center'>Bullish 🚀: <strong>{myBets[0].toString()} (wei)</strong></h5>
                <h5 className='font-weight-light text-center'>Neutral 🤷‍♂️: <strong>{myBets[1].toString()} (wei)</strong>‍</h5>
                <h5 className='font-weight-light text-center'>Bearish 🐻: <strong>{myBets[2].toString()} (wei)</strong></h5>

              </div>
            )
          } else {
            return (
              <div>

                <h2 className='text-center font-weight-light my-4'>The prediction market has been settled!</h2>

                <h2 className='text-center my-4'><em>What will be the price of ETH/USD at {marketSettleTime.toUTCString()} ?</em></h2>

                <div className='row align-items-center my-2 p-3 mb-2 bg-light text-dark'>

                  <div className='col-sm-7'>
                    <p className='lead text-center'>Total bet distribution by market participants:</p>
                    <div>
                      <Pie data={betPredictions}/>
                    </div>
                  </div>

                  <div className='col-sm-5'>

                    <div className='row my-2'>
                      <div className='card'>
                        <div className='card-body'>
                          <h5 className='card-title text-center'>Quick stats</h5>
                            <ul>
                              <li>Winning option: {marketInfo[8] === 0 ? <strong>Bullish 🚀</strong> : <strong></strong>}{marketInfo[8] === 1 ? <strong>Neutral 🤷‍♂️</strong> : <strong>Bearish 🐻</strong>}</li>
                              <li>Total betting pool distributed over winners: <strong>{ethers.utils.formatEther(marketInfo[9])} (ether)</strong></li>
                            </ul>
                        </div>
                      </div>
                    </div>

                    <div className='row my-2'>
                      <div className='card text-center'>
                        <div className='card-body'>
                          <h5 className='card-title'>Create a new prediction market!</h5>
                          <p>Click the button below to start a new prediction market, based on the current ETH/USD price and timestamp.</p>
                          <button type='submit' className='btn btn-success' onClick={e => createNewMarket()}>Create new market</button>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                <h3 className='font-weight-light text-center my-4'>Your current bets in this market</h3>
                <h5 className='font-weight-light text-center'>Bullish 🚀: <strong>{myBets[0].toString()} (wei)</strong></h5>
                <h5 className='font-weight-light text-center'>Neutral 🤷‍♂️: <strong>{myBets[1].toString()} (wei)</strong>‍</h5>
                <h5 className='font-weight-light text-center'>Bearish 🐻: <strong>{myBets[2].toString()} (wei)</strong></h5>

              </div>
            )
          }
      })()}

        <div className='row align-items-center my-5'>
          <div className='col-sm-12'>
            <TradingViewWidget symbol="COINBASE:ETHUSD" interval="60" />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Market;
