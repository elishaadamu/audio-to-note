const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY
});

async function testAudioGPT() {
  console.log("Fetching reference audio file (alloy.wav)...");
  
  try {
    const url = "https://cdn.openai.com/API/docs/audio/alloy.wav";
    const audioResponse = await fetch(url);
    const buffer = await audioResponse.arrayBuffer();
    const base64str = Buffer.from(buffer).toString("base64");

    console.log("Audio converted to Base64 directly in memory.");
    console.log("Dispatching payload to OpenAI gpt-4o-audio-preview format...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Please transcribe this audio exactly and summarize what it implies." },
            { type: "input_audio", input_audio: { data: base64str, format: "wav" }}
          ]
        }
      ],
    });

    console.log("\n✅ OpenAI API Success!");
    console.log("-----------------------------------------");
    console.log("TRANSCRIPT & RESPONSE:");
    console.log(response.choices[0].message.content);
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ OpenAI API Error:", error.message);
  }
}

testAudioGPT();
