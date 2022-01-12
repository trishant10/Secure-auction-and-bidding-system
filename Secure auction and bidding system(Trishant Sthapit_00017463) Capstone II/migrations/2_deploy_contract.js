const SecureAuction = artifacts.require("SecureAuction");

module.exports = function(deployer) {
  deployer.deploy(SecureAuction);
};