import { ethers, Contract } from 'ethers';
import Predicty from './contracts/Predicty.json';

const getBlockchain = () =>
  new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      if(window.ethereum) {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();

        const predicty = new Contract(
          Predicty.networks[window.ethereum.networkVersion].address,
          Predicty.abi,
          signer
        );

        resolve({signerAddress, predicty});

      }
    })
  });

export default getBlockchain;
