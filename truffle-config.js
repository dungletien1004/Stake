module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        ganache: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*" // Match any network id
        }
    },
    // Configure your compilers
    compilers: {
        solc: {
            version: "^0.8.4",
            settings: {          // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
  };
  