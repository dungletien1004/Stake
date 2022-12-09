const Token = artifacts.require("./DungToken.sol");

module.exports = function (deployer) {
    deployer.deploy(Token);
};
