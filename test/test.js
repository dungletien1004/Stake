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

  it("staking", async () => {
    const LTDToken = await DungToken.deployed();
    const staker = await Staking.deployed(LTDToken.address);
    const stakingToken = await staker.stakingToken.call();
    let apy = 10;
    const stakeToken = await DungToken.at(stakingToken);
    
    let defaultAmount = web3.utils.toWei((10**8).toString());
    await stakeToken.approve(staker.address, defaultAmount, defaultOptions);
    await stakeToken.transfer(staker.address, defaultAmount, defaultOptions);


    let defaultAmountForAccount1 = web3.utils.toWei("400");
    await stakeToken.approve(accounts[1], defaultAmountForAccount1, defaultOptions);
    await stakeToken.transfer(accounts[1], defaultAmountForAccount1, defaultOptions);

    const owner = await staker.owner.call();
    let depositAmount = web3.utils.toWei("200");

    const lockedStaking = await staker.lockedStake({from: owner});
    console.log('Locked', lockedStaking)

    const unLockedStaking = await staker.unLockedStake({from: owner});
    console.log('Unlocked', unLockedStaking);
    
    await stakeToken.approve(staker.address, depositAmount, accountsOptions1);
    const deposit = await staker.deposit(depositAmount, apy, accountsOptions1);
    console.log('deposit', deposit.logs[0]);

    let startingTime = await getTime();
    console.log('time',startingTime)
    let secsToAdvance = 60*60*24*50;
    await timeMachine.advanceTimeAndBlock(secsToAdvance);
    let nowtime = await getTime();
    console.log('time',nowtime);

    const contract = await staker.getStakerFromId(accounts[1], 0);
    console.log('contract', contract);

    const rewardNow = await staker.getRewardOfStakerWithId(accounts[1], 0);
    console.log('reward', Number(rewardNow));

    const withdraw = await staker.withdraw(0,accountsOptions1);
    console.log('draw', withdraw.logs[0]);
    
  })
})