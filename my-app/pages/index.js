import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from 'web3modal'
import { ethers } from 'ethers'
import { useEffect, useRef, useState } from 'react'
import { TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants'

export default function Home() {

  const zero = ethers.BigNumber.from(0);
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);


  /**
  * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
  */
  const getTokensToBeClaimed = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        let amount = 0;
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(ethers.BigNumber.from(amount));
      }

    } catch (error) {
      console.error(error);
    }
  }

  /**
   * getBalanceOfCryptoDevTokens: checks the balance of Crypto Dev Tokens's held by an address
   */
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);

    } catch (error) {
      console.error(error);
    }
  }

  /**
   * mintCryptoDevToken: mints `amount` number of tokens to a given address
   */
  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const address = await signer.getAddress();
      const value = 0.001 * amount;
      const txn = await tokenContract.mint(amount, {
        value: ethers.utils.parseEther(value.toString())
      })
      setLoading(true);
      await txn.wait();
      setLoading(false);
      window.alert("Sucessfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * claimCryptoDevTokens: Helps the user claim Crypto Dev Tokens
   */

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const txn = await tokenContract.claim();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      window.alert("Sucessfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * getTotalTokensMinted: Retrieves how many tokens have been minted till now
   * out of the total supply
   */

  const getTotalTokensMinted = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * getOwner: gets the contract owner by connected address
   */

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const owner = await tokenContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }

    } catch (error) {
      console.error(error);
    }
  }

  /**
 * withdrawCoins: withdraws ether by calling
 * the withdraw function in the contract
 */
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const txn = await tokenContract.withdraw();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      // await getOwner();

    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (e) {
      console.error(e.message);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new ethers.providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Please, change the network to the Goerli!" + chainId);
        throw new Error("Incorrect network: " + chainId);
      }

      if (needSigner) {
        return web3Provider.getSigner();
      }
      return web3Provider;
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    console.log(walletConnected);
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false
      })
      // connectWallet();
      // withdrawCoins();
    } else {
      getBalanceOfCryptoDevTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
      getOwner();
    }
  }, [walletConnected]);

  function renderLoading() {
    return (
      <div className={styles.description}> Loading... </div>
    );
  }

  function renderButton() {
    if (loading) {
      return renderLoading();
    }
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens could be claimed.
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim
          </button>
        </div>
      )
    }
    // { display: "flex-col" }
    return (
      <div style={{ display: "flex-col" }}>
        {/* // <div> */}
        <div>
          <input
            type="number"
            className={styles.input}
            placeholder="Amount of tokens to mints"
            onChange={(e) => setTokenAmount(ethers.BigNumber.from(e.target.value))}
          />
        </div>
        <button
          className={styles.button}
          onClick={() => mintCryptoDevToken(tokenAmount)}
          disabled={!(tokenAmount > 0)}
        >
          Mint
        </button>
      </div>
    )
  }

  function renderOwnerButton() {
    if (!isOwner) {
      return ("");
    }
    if (loading) {
      return renderLoading();
    }
    return (
      <button className={styles.button} onClick={withdrawCoins}>
        Withdraw
      </button>
    )
  }

  function renderDescription() {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Conntect Wallet
        </button>
      )
    }

    return (
      <div>
        <div className={styles.description}>
          You have minted {ethers.utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev Token.
        </div>

        <div className={styles.description}>
          Overall {ethers.utils.formatEther(tokensMinted)}/10000 have already been minted.
        </div>

        {renderButton()}
        {renderOwnerButton()}

      </div>
    )


  }

  return (
    <div>
      <Head>
        <title>
          CryptoDevs ICO
        </title>
        <meta name="description" content="ICO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
            Welcome to CryptoDevs ICO!
          </h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here.
          </div>
          {renderDescription()}
        </div>
        <div>
          <img className={styles.image} src='./0.svg' />
        </div>

      </div>

      <footer className={styles.footer}>
        From ABaaaC with &#9829;
      </footer>

    </div>
  )
}
