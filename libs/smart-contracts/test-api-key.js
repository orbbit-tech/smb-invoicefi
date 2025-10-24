const { configVariable } = require("hardhat/config");

async function main() {
  try {
    const key = configVariable("ETHERSCAN_API_KEY");
    console.log("API Key type:", typeof key);
    console.log("API Key length:", key ? key.length : 0);
    console.log("API Key first 5 chars:", key ? key.substring(0, 5) : "empty");
  } catch (error) {
    console.error("Error accessing API key:", error.message);
  }
}

main();
