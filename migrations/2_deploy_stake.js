var Token = artifacts.require("./DungToken.sol");
var Staking = artifacts.require("./Stake.sol");

module.exports = function (deployer) {
  deployer.deploy(Staking, Token.address);
};