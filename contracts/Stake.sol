// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;
import "./DungToken.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error TransferFailed();
error NeedsMoreThanZero();
contract Stake {
  IERC20 public stakingToken;
  uint256 public countId;
  address public owner;
  bool private locked;
  uint256 public totalTokenLocked;
  constructor(address _stakingToken) {
    stakingToken = IERC20(_stakingToken);
    countId = 0;
    owner = msg.sender;
    locked = false;
  }
  struct Staker {
    uint256 id;
    uint256 apy;
    uint256 startDay;
    uint256 endDay;
    uint256 amount;
  }

  mapping(address => mapping(uint256 => Staker)) public depositContract;
  mapping(address => uint256[]) contractStakerWithId;
  uint256 totalStaking;


  event DepositLog(address from, uint256 amount, uint256 apy);
  event withdrawLog(address to, uint256 amount);
  event lockedStaking(address _owner,uint256 amount);
  event unLockedStaking(address _owner,uint256 amount);

  function getEndDate(uint256 _apy) private view returns (uint256) {
    uint256 endDate = block.timestamp + 24 * 60 * 60 * 30;
    if (_apy == 10) {
      endDate = block.timestamp + 24 * 60 * 60 * 30 * 3;
    } 
    if (_apy == 50) {
      endDate = block.timestamp + 24 * 60 * 60 * 30 * 9;
    }
    return endDate;
  }
  function getToken(address _address) external view returns(uint256) {
    return stakingToken.balanceOf(_address);
  }

  function deposit(uint256 _amount, uint256 _apy) external {
    require(!locked, "Staking locked by Owner");
    require(_amount > 0, "Amount cannot be 0");
    require(_apy > 0, "APY cannot be 0");
    require(_amount <= stakingToken.balanceOf(msg.sender),"Not enough tokens in your wallet");
    bool success = stakingToken.transferFrom(msg.sender, address(this), _amount);
    if(!success) {
      revert TransferFailed();
    }
    uint256 endDate = getEndDate(_apy);
    depositContract[msg.sender][countId].id = countId;
    depositContract[msg.sender][countId].apy = _apy;
    depositContract[msg.sender][countId].startDay = block.timestamp;
    depositContract[msg.sender][countId].endDay = endDate;
    depositContract[msg.sender][countId].amount = _amount;
    contractStakerWithId[msg.sender].push(countId);
    countId++;
    emit DepositLog(msg.sender, _amount, _apy);
  }

  function withdraw(uint256 _stakeId) external {
    require(!locked, "Staking locked by Owner");
    Staker memory staker = depositContract[msg.sender][_stakeId];
    uint256 reward = caculatorReward(
      staker.apy,
      staker.amount,
      staker.startDay,
      staker.endDay
    );
    uint256 totalAmount = staker.amount + reward;
    stakingToken.approve(msg.sender, totalAmount);
    bool success = stakingToken.transfer(msg.sender, totalAmount);
    require(success, "Fail!");
    emit withdrawLog(msg.sender, totalAmount);
  }

  function caculatorReward(
    uint256 _apy,
    uint256 _amount,
    uint256 _startDay,
    uint256 _endDay
    ) private view returns (uint256) {
      uint256 time;
      if (block.timestamp >= _endDay) {
        time = _endDay - _startDay;
      } else {
        time =block.timestamp - _startDay;
      }
      uint256 day = this.getDayWithApy(_apy);
      uint256 reward = (_amount*_apy*time)/(100*day*24*60*60);
      return reward;
  }
  function getDayWithApy(uint256 _apy) external pure returns (uint256) {
      uint256 day = 30;
      if (_apy == 10) {
        day = 30 * 3;
      } else if (_apy == 50) {
        day = 30 * 9;
      }
      return day;
  }

  function getStakerId(address _staker) external view returns(uint256[] memory) {
    return contractStakerWithId[_staker];
  }
  function getStakerFromId(address _staker, uint256 _id) external view returns(Staker memory) {
    Staker memory staker = depositContract[_staker][_id];
    return staker;
  }
  
  function getRewardOfStakerWithId(address _staker, uint256 _id) external view returns(uint256) {
    Staker memory staker = depositContract[_staker][_id];
    uint256 reward = caculatorReward(
      staker.apy,
      staker.amount,
      staker.startDay,
      staker.endDay
    );
    return reward;
  }

  function lockedStake() external {
    require(!locked, "Staking is locked");
    require(msg.sender == owner, "Only owner can locked stake");
    totalTokenLocked = stakingToken.balanceOf(address(this));
    bool success = stakingToken.transfer(owner, totalTokenLocked);
    require(success, "Locked fail!");
    locked = true;
    emit lockedStaking(owner, totalTokenLocked);
  }
  function unLockedStake() external {
    require(locked, "Staking is unlocked");
    require(msg.sender == owner, "Only owner can unlocked stake");
    bool success = stakingToken.transferFrom(owner, address(this), totalTokenLocked);
    require(success, "unLocked fail!");
    emit unLockedStaking(owner, totalTokenLocked);
    totalTokenLocked = 0;
    locked = false;
  }
}