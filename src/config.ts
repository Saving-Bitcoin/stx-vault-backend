import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Hiro API
  hiroApiKey: process.env.HIRO_API_KEY || "",

  // Contract
  contractAddress:
    process.env.CONTRACT_ADDRESS || "SP1WEKNK5SGNTYM0J8M34FMBM7PTRJSYRWY9C1CGR",
  contractName: process.env.CONTRACT_NAME || "vault-v2",

  // Webhook
  webhookUrl: process.env.WEBHOOK_URL || `http://localhost:3001/webhook`,
};

// Validation
if (!config.hiroApiKey && config.nodeEnv === "production") {
  console.warn(
    "⚠️  HIRO_API_KEY is not set. Chainhooks registration will fail."
  );
}

export const getContractIdentifier = () => {
  return `${config.contractAddress}.${config.contractName}`;
};
