const fs = require('fs');

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No API key");
    return;
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: "A shiny red cube on a white background" }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    }
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    if (data.candidates && data.candidates[0].content.parts[0].inlineData) {
        console.log("Success! Got image data starting with:", data.candidates[0].content.parts[0].inlineData.data.substring(0, 30));
    } else {
        console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch(e) {
    console.error("Error:", e);
  }
}

testGemini();
