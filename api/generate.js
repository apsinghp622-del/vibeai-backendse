
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "AI API key is not configured"
    });
  }

  try {
    const { type, prompt, language = "Hindi" } = req.body || {};

    const allowedTypes = [
      "Bio",
      "Username",
      "Caption",
      "Hashtags",
      "Story",
      "Quotes"
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: "Invalid content type"
      });
    }

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 1000
    ) {
      return res.status(400).json({
        error: "Please enter a topic (max 1000 characters)"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          instructions:
            "You are VibeAI, a creative social media content assistant. Generate original, useful, age-appropriate content. Follow the requested language. Keep the output concise and do not add unnecessary explanations.",
          input: `Create ${type} content about: ${prompt.trim()}. Language: ${language}.`,
          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "AI request failed"
      });
    }

    const result = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      success: true,
      result
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
}
