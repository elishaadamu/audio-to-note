const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testGeminiAudio() {
  console.log("Fetching reference audio file (alloy.wav)...");
  try {
    const url = "https://cdn.openai.com/API/docs/audio/alloy.wav";
    const audioResponse = await fetch(url);
    const buffer = await audioResponse.arrayBuffer();
    const base64str = Buffer.from(buffer).toString("base64");

    console.log("Audio converted to Base64.");
    console.log("Dispatching payload to Gemini 1.5 Flash multimodal...");

    const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      "Please transcribe this audio exactly and summarize what it implies.",
      {
        inlineData: {
          data: base64str,
          mimeType: "audio/wav"
        }
      }
    ]);

    console.log("\n✅ Gemini API Success!");
    console.log("-----------------------------------------");
    console.log("TRANSCRIPT & RESPONSE:");
    console.log(result.response.text());
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
  }
}

testGeminiAudio();
