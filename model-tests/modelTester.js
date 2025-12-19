const axios = require("axios");

// 🔑 Hardcoded API key (replace with your actual OpenRouter API key)
const OPENROUTER_API_KEY = "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";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free models to test
const models = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "x-ai/grok-code-fast-1",
  "google/gemma-3-12b-it:free",
  "kwaipilot/kat-coder-pro:free",
  "qwen/qwen3-coder",
  "openai/gpt-5.2-pro"

];

const testPrompt = "Generate a simple HTML page with a centered title saying 'Hello World'.";

async function testModel(model) {
  try {
    console.log(`\n🔵 Testing model: ${model}`);

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        messages: [{ role: "user", content: testPrompt }],
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
      }
    );

    const output = response.data.choices?.[0]?.message?.content || "";
    console.log(`✅ SUCCESS — Output length: ${output.length}`);
    console.log(output.slice(0, 200) + (output.length > 200 ? "..." : ""));
  } catch (err) {
    console.log(`❌ FAILED — ${model}`);
    console.log("Error details:", err?.response?.data || err?.message || err);
  }
}

async function runTests() {
  console.log("🚀 Starting OpenRouter model tests...");

  for (const model of models) {
    await testModel(model);
  }

  console.log("\n🎉 All tests finished.");
}

runTests();
