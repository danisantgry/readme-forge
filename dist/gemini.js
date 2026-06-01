import { generateReadme } from "./generator.js";
export async function generateWithGemini(facts) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set. Run without --ai or set the key in your environment.");
    }
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
    const prompt = `Write a polished, accurate README.md for this project. Do not invent features. Use this metadata:\n${JSON.stringify(facts, null, 2)}\n\nStarter README:\n${generateReadme(facts)}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
    });
    if (!response.ok) {
        throw new Error(`Gemini request failed with ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json());
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text)
        throw new Error("Gemini returned an empty response.");
    return text;
}
