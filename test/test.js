var DungToken = artifacts.require("./DungToken.sol");
const timeMachine = require('ganache-time-traveler');
var Staking = artifacts.require("./Stake.sol");
contract('Staking', async function(accounts){
  beforeEach(async() => {
    let snapshot = await timeMachine.takeSnapshot();
    snapshotId = snapshot['result'];
  });

  afterEach(async() => {
      await timeMachine.revertToSnapshot(snapshotId);
  });
  console.log(accounts);
  provider = web3.currentProvider;
  let defaultOptions = { from: accounts[0] };
  let accountsOptions1 = { from: accounts[1] };
  async function getTime() {
    return (await web3.eth.getBlock((await web3.eth.getBlockNumber())))["timestamp"];
  }

  it("staking transfer", async () => {
    const LTDToken = await DungToken.deployed();
    const staker = await Staking.deployed(LTDToken.address);
    const stakingToken = await staker.stakingToken.call();
    const stakeToken = await DungToken.at(stakingToken);
    
    let defaultAmount = web3.utils.toWei((10**8).toString());
    await stakeToken.approve(staker.address, defaultAmount, defaultOptions);
    await stakeToken.transfer(staker.address, defaultAmount, defaultOptions);


    let defaultAmountForAccount1 = web3.utils.toWei("400");
    await stakeToken.approve(accounts[1], defaultAmountForAccount1, defaultOptions);
    await stakeToken.transfer(accounts[1], defaultAmountForAccount1, defaultOptions);

    const tokenOfAccount1 = await staker.getToken(accounts[1]);
    assert.equal(Number(tokenOfAccount1),defaultAmountForAccount1, "400000000000000000000") 
  });
  it("Staking Locked", async () => {
    const LTDToken = await DungToken.deployed();
    const staker = await Staking.deployed(LTDToken.address);

    const owner = await staker.owner.call();
    let isLocked = await staker.locked.call();
    assert.equal(isLocked,false, "Staking app unlocked")

    await staker.lockedStake({from: owner});
    isLocked = await staker.locked.call();
    assert.equal(isLocked,true, "Staking app is locked")
    
  });
  it("Change block.timestamp", async () => {
    let startingTime = await getTime();
    let secsToAdvance = 60*60*24*50;
    await timeMachine.advanceTimeAndBlock(secsToAdvance);
    let nowtime = await getTime();
    assert.equal(startingTime + secsToAdvance,nowtime, "Change block.timestamp 50 days")
  });
  it("Deposit token", async () => {
    const LTDToken = await DungToken.deployed();
    const staker = await Staking.deployed(LTDToken.address);
    const stakingToken = await staker.stakingToken.call();
    const stakeToken = await DungToken.at(stakingToken);
    
    let defaultAmount = web3.utils.toWei((10**8).toString());
    await stakeToken.approve(staker.address, defaultAmount, defaultOptions);
    await stakeToken.transfer(staker.address, defaultAmount, defaultOptions);


    let defaultAmountForAccount1 = web3.utils.toWei("400");
    await stakeToken.approve(accounts[1], defaultAmountForAccount1, defaultOptions);
    await stakeToken.transfer(accounts[1], defaultAmountForAccount1, defaultOptions);

    let apy = 10;
    let depositAmount = web3.utils.toWei("200");
    await stakeToken.approve(staker.address, depositAmount, accountsOptions1);
    await staker.deposit(depositAmount, apy, accountsOptions1);
    const stakerIds = await staker.getStakerId(accounts[1]);
    const stakerOfAccount1 = await staker.getStakerFromId(accounts[1] ,Number(stakerIds[0]));
    let startingTime = await getTime();
    let secsToAdvance = 60*60*24*30*3;
    await timeMachine.advanceTimeAndBlock(secsToAdvance);
    let endTime = await getTime();
    assert.equal(stakerOfAccount1.id,0, "Staking id: 0");
    assert.equal(stakerOfAccount1.apy,10, "Staking apy: 10");
    assert.equal(stakerOfAccount1.startDay,startingTime, "Staking startDay is the current day");
    assert.equal(stakerOfAccount1.endDay,endTime, "Staking endDay is the current ngayfplus 3 months");
    assert.equal(stakerOfAccount1.amount,depositAmount, "Staking amount: 200000000000000000000");
    
  });
  it("withdraw token", async () => {
    const LTDToken = await DungToken.deployed();
    const staker = await Staking.deployed(LTDToken.address);
    const stakingToken = await staker.stakingToken.call();
    const stakeToken = await DungToken.at(stakingToken);
    
    let defaultAmount = web3.utils.toWei((10**8).toString());
    await stakeToken.approve(staker.address, defaultAmount, defaultOptions);
    await stakeToken.transfer(staker.address, defaultAmount, defaultOptions);


    let defaultAmountForAccount1 = web3.utils.toWei("400");
    await stakeToken.approve(accounts[1], defaultAmountForAccount1, defaultOptions);
    await stakeToken.transfer(accounts[1], defaultAmountForAccount1, defaultOptions);

    let apy = 10;
    let depositAmount = web3.utils.toWei("200");
    await stakeToken.approve(staker.address, depositAmount, accountsOptions1);
    await staker.deposit(depositAmount, apy, accountsOptions1);

    let secsToAdvance = 60*60*24*30*3;
    await timeMachine.advanceTimeAndBlock(secsToAdvance);


    const reward = await staker.getRewardOfStakerWithId(accounts[1], 0);

    const withdraw = await staker.withdraw(0,accountsOptions1);
    const res = withdraw.logs[0].args;
    assert.equal(res.to, accounts[1], "Staking account withdraw");
    assert.equal(Number(res.amount), Number(reward) + Number(depositAmount), "Staking token that the account receives");
  });
})