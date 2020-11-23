import React from "react";
import roxy from "../images/roxy.jpg";

function About() {
  return (
    <div className="about">
      <div className="container">
        <div className="row align-items-center my-5">
          <div className="col-lg-7">
            <img
              className="img-fluid rounded mb-4 mb-lg-0"
              src={roxy}
              alt=""
            />
          </div>
          <div className="col-lg-5">
            <h1 className="font-weight-light">About</h1>
            <p>
              This decentralized app (dapp) is a brave attempt at the final project of
              the ConsenSys Blockchain Developer Online Bootcamp: 2020 edition. The dapp
              implements a transparent prediction market, relying on
              a <a href="https://feeds.chain.link/eth-usd">ChainLink pricefeed oracle</a> to
              enable the smart contract to retrieve real-world market prices and make
              the necessary decisions based on them.
            </p>
            <p>
              I had an awesome learning experience, coming from next to no knowledge at
              all to enjoying programming smart contracts in Solidity & JavaScript,
              using the Truffle & React frameworks. The future is decentralized!
            </p>
            <p>Thanks, ConsenSys!</p>
            <p>Source code available on <a href="https://github.com/knnlrts?tab=repositories">GitHub</a>.</p>
            <p>
              If you like this, please donate and help a brother out at <a href="https://etherscan.io/address/0x916a395e1b11f42363536bab02ef07568677a435">knnlrts.eth</a>!
              Thank you! Also, please enjoy the totally unrelated picture of my dog to the left :).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
