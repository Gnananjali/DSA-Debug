const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Analyzes a submitted solution using Groq.
 */
async function analyzeSubmission({ problemTitle, language, code, status }) {
  const prompt = `You are a precise code reviewer for a coding-practice platform.

Analyze the following ${language} solution to "${problemTitle}".
Execution status: ${status}

Respond with ONLY a valid JSON object in exactly this shape:
{
  "timeComplexity": "e.g. O(n)",
  "spaceComplexity": "e.g. O(1)",
  "summary": "one or two sentence plain-English summary of the approach",
  "suggestions": ["short actionable suggestion", "another suggestion"]
}

Do not include markdown fences or any text outside the JSON object.

Code:
\`\`\`${language}
${code}
\`\`\`
`;

  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.2,
    max_completion_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content || "";

  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return {
      timeComplexity: "unknown",
      spaceComplexity: "unknown",
      summary: "AI analysis could not be parsed.",
      suggestions: [],
    };
  }
}

module.exports = { analyzeSubmission };