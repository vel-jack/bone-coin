import { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import { contractABI, contractAddress } from "./utils/contract";

function App() {
  const [coinName, setCoinName] = useState(null);
  const [tickerSymbol, setTickerSymbol] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [inputValue, setInputValue] = useState({
    transferAddress: "",
    transferAmount: "",
    mintAmount: "",
    burnAmount: "",
  });
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [tokenOwner, setTokenOwner] = useState("");
  const [ownedTokens, setOwnedTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  //

  const getContract = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const bankContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    return bankContract;
  };

  const checkIsWalletConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCoinInfo = async () => {
    try {
      if (window.ethereum) {
        const coinContract = getContract();
        let name = await coinContract.name();
        let symbol = await coinContract.symbol();
        let tSupply = await coinContract.totalSupply();
        setCoinName(name);
        setTickerSymbol(symbol);
        setTotalSupply(utils.formatEther(tSupply));
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const tokenOwnerHandler = async () => {
    try {
      if (window.ethereum) {
        const coinContract = getContract();
        let owner = await coinContract.owner();
        setTokenOwner(owner);
        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (owner.toLowerCase() === account.toLowerCase()) {
          setIsOwner(true);
        }
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const ownedTokenHandler = async () => {
    try {
      if (window.ethereum) {
        const coinContract = getContract();
        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        let bal = await coinContract.balanceOf(account);
        setOwnedTokens(utils.formatEther(bal));
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const transferHandler = async () => {
    try {
      if (window.ethereum) {
        const coinContract = getContract();
        let to = inputValue.transferAddress;
        let bncAmount = utils.parseEther(inputValue.transferAmount);
        const tx = await coinContract.transfer(to, bncAmount);
        console.log("Processing ");
        tx.wait();
        setIsLoading(true);
        console.log("Processed, Hash : ", tx.hash);
        await ownedTokenHandler();
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const mintHandler = async () => {
    try {
      if (window.ethereum) {
        const coinContract = getContract();
        let to = inputValue.mintAddress;
        let bncAmount = utils.parseEther(inputValue.mintAmount);
        const tx = await coinContract.mint(to, bncAmount);
        console.log("Processing ");
        tx.wait();
        setIsLoading(true);
        console.log("Processed, Hash : ", tx.hash);
        await ownedTokenHandler();
        await getCoinInfo();
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const burnHandler = async () => {
    try {
      if (window.ethereum) {
        const coinContract = getContract();
        let bncAmount = utils.parseEther(inputValue.burnAmount);
        const tx = await coinContract.burn(bncAmount);
        console.log("Processing ");
        tx.wait();
        setIsLoading(true);
        console.log("Processed, Hash : ", tx.hash);
        await getCoinInfo();
      } else {
        window.alert("Please install Metamask");
        console.log("No ethereum providers available");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInput = (e) => {
    setInputValue((prevValue) => ({
      ...prevValue,
      [e.target.name]: e.target.value,
    }));
  };
  const tokensBurnedEventHandler = (_owner, _amount, _msg) => {
    setIsLoading(false);
    console.log(_msg);
    getCoinInfo();
    ownedTokenHandler();
  };
  const tokensMintedEventHandler = (_owner, _amount, _msg) => {
    setIsLoading(false);
    console.log(_msg);
    getCoinInfo();
    ownedTokenHandler();
  };
  const transferEventHandler = (_from, _to, _amount) => {
    setIsLoading(false);
    console.log(`${utils.formatEther(_amount)} transfered`);
    ownedTokenHandler();
  };
  useEffect(() => {
    checkIsWalletConnected();
    getCoinInfo();
    tokenOwnerHandler();
    ownedTokenHandler();
    if (isWalletConnected) {
      const coinContract = getContract();
      coinContract.on("tokensBurned", tokensBurnedEventHandler);
      coinContract.on("additionalTokensMinted", tokensMintedEventHandler);
      coinContract.on("Transfer", transferEventHandler);
    }

    return () => {
      if (isWalletConnected) {
        const coinContract = getContract();
        coinContract.off("tokensBurned");
        coinContract.off("additionalTokensMinted");
        coinContract.off("Transfer");
      }
  }, [isWalletConnected]);
  return (
    <div className="flex flex-col justify-center items-center p-10 bg-black min-h-screen">
      <div className=" w-full border-[#fad54c] flex flex-col lg:flex-row ">
        <div className="p-4 space-y-8 flex-1">
          <div className="text-3xl">
            <span className=" bg-gradient-to-tr from-[#fad54c] to-[#a17015] inline-block font-bold text-transparent bg-clip-text">
              Bone Coin Project
            </span>{" "}
            <span className={`${isLoading ? "animate-ping" : ""}`}>🦴</span>
          </div>
          <div className="text-white">
            <p>
              <span className="font-bold">Coin : </span> {coinName} 🦴 &nbsp;
              <span className="font-bold">Ticker : </span> {tickerSymbol} &nbsp;
              <span className="font-bold">Total Supply : </span> {totalSupply}{" "}
              {tickerSymbol}
            </p>
          </div>
          <div className="flex flex-col border border-[#a17015] text-white">
            <div className="p-3 bg-[#1e2836]">
              <input
                type="text"
                name="transferAddress"
                onChange={handleInput}
                value={inputValue.transferAddress}
                className="w-full bg-transparent outline-none "
                placeholder="Wallet Address"
              />
            </div>
            <div className="p-3 bg-[#1e2836] ">
              <input
                type="number"
                name="transferAmount"
                step="0.0001"
                onChange={handleInput}
                value={inputValue.transferAmount}
                className="w-full bg-transparent outline-none "
                placeholder="Token amount ( ex : 0.0000 BNC )"
              />
            </div>
            <button
              className="bg-[#e98e26] p-3 font-bold uppercase w-full"
              onClick={transferHandler}
            >
              Transfer Tokens
            </button>
          </div>
          {isOwner && (
            <>
              <div className="flex flex-col border border-[#a17015] text-white">
                <div className="p-3 bg-[#1e2836]">
                  <input
                    type="text"
                    name="mintAddress"
                    onChange={handleInput}
                    value={inputValue.mintAddress}
                    className="w-full bg-transparent outline-none "
                    placeholder="Wallet Address"
                  />
                </div>
                <div className="p-3 bg-[#1e2836] ">
                  <input
                    type="number"
                    name="mintAmount"
                    step="0.0001"
                    onChange={handleInput}
                    value={inputValue.mintAmount}
                    className="w-full bg-transparent outline-none "
                    placeholder="Token amount ( ex : 0.0000 BNC )"
                  />
                </div>
                <button
                  className="bg-[#e98e26] p-3 font-bold uppercase w-full"
                  onClick={mintHandler}
                >
                  Mint new Tokens
                </button>
              </div>
              <div className="flex flex-col border border-[#a17015] text-white">
                <div className="p-3 bg-[#1e2836] ">
                  <input
                    type="number"
                    name="burnAmount"
                    step="0.0001"
                    onChange={handleInput}
                    value={inputValue.burnAmount}
                    className="w-full bg-transparent outline-none "
                    placeholder="Token amount ( ex : 0.0000 BNC )"
                  />
                </div>
                <button
                  className="bg-[#e98e26] p-3 font-bold uppercase w-full"
                  onClick={burnHandler}
                >
                  Burn Tokens
                </button>
              </div>
            </>
          )}
        </div>
        <div className="text-white p-4 lg:w-1/2 lg:flex lg:flex-col lg:pl-10 lg:justify-center">
          <p>
            <span className="px-1 text-lg font-bold">Owned Tokens : </span>
            <span>{ownedTokens} BNC</span>
          </p>
          <p>
            <span className="px-1 text-lg font-bold">
              Token Owner Address :
            </span>
            <span>{tokenOwner}</span>
          </p>
          {isWalletConnected && (
            <p>
              <span className="px-1 text-lg font-bold">
                Your Wallet Address :
              </span>
              <span>{customerAddress}</span>
            </p>
          )}

          {!isWalletConnected && (
            <div className="py-4">
              <button
                className="bg-[#f1933a] px-8 py-3  font-bold uppercase rounded-lg"
                onClick={checkIsWalletConnected}
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
