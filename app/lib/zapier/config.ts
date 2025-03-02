// Simple configuration without Zod dependency
const API_KEY = 'sk-ak-mbR1iAzMLs1dXtaWrs2hgJDfR6';

export const zapierConfig = {
  apiKey: API_KEY,
};

export const isZapierConfigured = () => {
  const isConfigured = !!zapierConfig.apiKey;
  console.log("[Zapier Config] Configuration check:", isConfigured ? "Configured" : "Not configured");
  return isConfigured;
}; 