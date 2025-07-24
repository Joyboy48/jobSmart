import { Request, Response } from "express";
import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import OpenAI from "openai";
// @ts-ignore
import { parse as parseJson } from "dirty-json";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Helper to decode HTML entities (e.g., &quot; to ")
function decodeHtmlEntities(str: string): string {
  return str.replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
}

export const skillGapAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const user = await User.findById(userId);
  if (!user) throw new apiError(404, "User not found");

  const userSkills = user.skills || [];
  const jobTitle = req.body.jobTitle as string | undefined;
  const jobDescription = req.body.jobDescription as string | undefined;

  if (!jobTitle && !jobDescription) {
    throw new apiError(400, "Please provide a jobTitle or jobDescription for skill gap analysis.");
  }

  const targetContext = jobDescription
    ? `the following job description: ${jobDescription}`
    : `the role of: ${jobTitle}`;

  const systemPrompt = `
You are a professional career coach. Respond ONLY with a valid JSON object with the keys: currentSkills, missingSkills, prioritySkills, skillGapExplanation, learningResources, learningPath, projectSuggestions, proficiencyLevels, marketInsights. 
Do NOT include any explanation, comments, or text outside the JSON. 
If you understand, reply only with the JSON object and nothing else.`;

  const prompt = `
Compare the following user's skills to the requirements for ${targetContext}.
Return a JSON object with:
- currentSkills: skills the user already has for the role
- missingSkills: skills the user is missing
- prioritySkills: top 3-5 skills to focus on first
- skillGapExplanation: a brief summary of the biggest gaps and why they matter
- learningResources: for each missing skill, provide an array of 2-3 high-quality resources (video, interactive, book, free/paid, with URLs and type). Use only official documentation, Coursera, Udemy, freeCodeCamp, or YouTube. If unsure of the exact URL, write 'official site' or 'search on YouTube'.
- learningPath: an ordered list of steps/milestones to close the skill gap (e.g., "Learn Python basics", "Build a Django project", "Deploy on AWS")
- projectSuggestions: for each missing skill, suggest 1-2 hands-on projects or coding challenges
- proficiencyLevels: for each current and missing skill, estimate proficiency as Beginner, Intermediate, or Advanced (based on skills list)
- marketInsights: for each missing skill, provide a demand score (1-10) and a brief note on job market value
User's skills: ${JSON.stringify(userSkills)}
Target role/job description: ${jobDescription || jobTitle}
If you include anything other than the JSON object, your answer will be rejected.`;

  const completion = await openai.chat.completions.create({
    model: "moonshotai/kimi-dev-72b:free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ]
  });

  let analysis = null;
  const raw = completion.choices[0].message.content || "{}";
  let jsonBlocks: string[] = [];
  // 1. Code-fenced blocks
  let codeFenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/gi);
  if (codeFenceMatch && codeFenceMatch.length > 0) {
    jsonBlocks = codeFenceMatch.map(block =>
      block.replace(/```(?:json)?/i, "").replace(/```/g, "").trim()
    );
  }
  // 2. Any { ... } blocks (even outside code fences)
  let curlyMatches = raw.match(/\{[\s\S]*?\}/g);
  if (curlyMatches) {
    jsonBlocks = jsonBlocks.concat(curlyMatches.map(s => s.trim()));
  }
  // 3. Try to parse each block, first to last, after decoding HTML entities
  console.log("All extracted JSON blocks:", jsonBlocks);
  for (let i = 0; i < jsonBlocks.length; i++) {
    try {
      const decoded = decodeHtmlEntities(jsonBlocks[i]);
      const candidate = parseJson(decoded);
      if (
        candidate && typeof candidate === "object" &&
        candidate.currentSkills && Array.isArray(candidate.currentSkills) &&
        candidate.missingSkills && Array.isArray(candidate.missingSkills)
      ) {
        analysis = candidate;
        break;
      }
    } catch (e) {
      console.error("Parse error for block:", jsonBlocks[i], e);
    }
  }
  // 4. Fallback: try to decode and parse the whole raw string
  if (!analysis) {
    try {
      const decoded = decodeHtmlEntities(raw);
      const candidate = parseJson(decoded);
      if (candidate && typeof candidate === "object") {
        analysis = candidate;
      }
    } catch (e) {}
  }
  if (!analysis) {
    console.error("Failed to parse LLM response. Raw output:", raw);
    console.error("All extracted JSON blocks:", jsonBlocks);
    throw new apiError(500, "Failed to parse LLM response for skill gap analysis.");
  }

  // Update user.aiInsights.skillGaps and skillGapAnalysis
  user.aiInsights = user.aiInsights || {};
  user.aiInsights.skillGaps = Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [];
  (user.aiInsights as any).skillGapAnalysis = analysis;
  await user.save();

  res.status(200).json(new apiResponse(200, analysis, "Skill gap analysis completed successfully"));
}); 