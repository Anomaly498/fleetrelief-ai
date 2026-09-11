require('dotenv').config();
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  token: { token: process.env.BEDROCK_API_KEY },
  authSchemePreference: ['httpBearerAuth']
});

function cleanJsonString(raw) {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function analyzeTransitIncident(driverReport, routeContext, targetLang = "MATCH_INPUT") {
  const prompt = `You are FleetRelief AI, an autonomous transit incident dispatcher.
A driver submitted this incident: "${driverReport}" on Route: "${routeContext}".
Requested Language Mode: "${targetLang}"

CRITICAL RULES FOR "passengerNotice":
1. If Requested Language Mode is "BILINGUAL_DIALECT":
   - You MUST write the "passengerNotice" in a single blended, code-mixed colloquial vernacular (Latin/English alphabet) based on the context:
     * For Bengali context (Banglish): Blend Bengali and English naturally in English script.
       Example: "Shyambazar Panchmatha Mor er kache bus tyre e slow air leak issue detect hoyeche. Next terminal e mechanic team repair korbe, please thoda wait korun."
     * For Hindi context (Hinglish): Blend Hindi and English naturally in English script.
       Example: "Howrah bridge ke paas vehicle breakdown hua hai. Backup bus dispatch kar di gayi hai, thodi der me arrive hogi."
   - DO NOT just paste native script followed by English. It MUST be a single, smooth colloquial hybrid sentence in Roman script!
2. If Requested Language Mode is "MATCH_INPUT":
   - Write "passengerNotice" in the exact same script and dialect as the driver's input.
3. If Requested Language Mode is "ENGLISH":
   - Write "passengerNotice" in clear standard English.
4. "passengerNoticeEnglish": ALWAYS provide a clean standard English version.
5. "summary": 1 concise sentence in English.
6. "immediateAction": Fleet/depot operational directive in English.

Respond strictly in raw JSON without markdown or backticks:
{
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "detectedLanguage": "string",
  "summary": "string",
  "immediateAction": "string",
  "passengerNotice": "string",
  "passengerNoticeEnglish": "string"
}`;

  const command = new ConverseCommand({
    modelId: "amazon.nova-lite-v1:0",
    messages: [{ role: "user", content: [{ text: prompt }] }]
  });

  const response = await client.send(command);
  const rawText = response.output.message.content[0].text;
  return cleanJsonString(rawText);
}

module.exports = { analyzeTransitIncident };