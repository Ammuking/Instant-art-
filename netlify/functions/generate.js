// netlify/functions/generate.js

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Only POST method allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const prompt = body.prompt;

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Prompt missing" }) };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API key missing on server" }) };
    }

    // ⭐ Google Gemini 2.5 Flash Image (Nano Banana) MODEL NAME
    const modelName = "gemini-2.5-flash-image-nano-banana";

    // ⭐ Google Generative Language API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateImage?key=${apiKey}`;

    // ⭐ Request body (Google image generation format)
    const reqBody = {
      prompt: {
        text: prompt
      }
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqBody)
    });

    const data = await resp.json();

    return {
      statusCode: resp.status,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: err.message })
    };
  }
};
