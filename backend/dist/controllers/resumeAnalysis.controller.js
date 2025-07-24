import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fetch from "node-fetch";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import OpenAI from "openai";
import path from "path";
import fs from "fs";
// @ts-ignore
import { parse as parseJson } from "dirty-json";
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});
function getFileExtension(url) {
    return path.extname(url).toLowerCase();
}
async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error("Failed to download file");
    const fileStream = fs.createWriteStream(dest);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", () => resolve());
    });
    return dest;
}
async function extractText(filePath, ext) {
    if ([".pdf"].includes(ext)) {
        const data = new Uint8Array(fs.readFileSync(filePath));
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + " ";
        }
        return text;
    }
    else if ([".docx"].includes(ext)) {
        const { value } = await mammoth.extractRawText({ path: filePath });
        return value;
    }
    else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        const { data: { text } } = await Tesseract.recognize(filePath, "eng");
        return text;
    }
    else {
        throw new Error("Unsupported file type");
    }
}
// Helper to check if object matches expected structure
function isValidAnalysis(obj) {
    if (!obj || typeof obj !== "object")
        return false;
    // Case 1: Role-based (e.g., BackendDeveloper, UIDesigner)
    const roleKeys = Object.keys(obj);
    if (roleKeys.length > 0 && roleKeys.every(role => {
        const v = obj[role];
        return v && typeof v === "object" &&
            ["strengths", "weaknesses", "missingSkills", "improvementTips"].every(k => Array.isArray(v[k]));
    })) {
        return true;
    }
    // Case 2: Flat (just strengths, weaknesses, ...)
    if (["strengths", "weaknesses", "missingSkills", "improvementTips"].every(k => Array.isArray(obj[k]))) {
        return true;
    }
    return false;
}
// Helper to decode HTML entities (e.g., &quot; to ")
function decodeHtmlEntities(str) {
    return str.replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}
export const analyzeResume = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user || !user.resumeUrl)
        throw new apiError(400, "No resume found for analysis");
    if (!user.jobPreferences || user.jobPreferences.length === 0)
        throw new apiError(400, "Set at least one job preference before analysis");
    // --- Enhancement: Accept job description or job title for targeted analysis ---
    // Encourage frontend to prompt user for job preferences and/or job description for best results
    // req.body.jobDescription: string (optional)
    // req.body.jobTitle: string (optional)
    const jobDescription = req.body.jobDescription;
    const jobTitle = req.body.jobTitle;
    // Ensure HTTPS for Cloudinary URLs
    let resumeUrl = user.resumeUrl;
    if (resumeUrl.startsWith("http://")) {
        resumeUrl = resumeUrl.replace("http://", "https://");
    }
    console.log("Attempting to download resume from:", resumeUrl);
    // Download resume
    const ext = getFileExtension(resumeUrl);
    const tempPath = `./temp_resume_${userId}${ext}`;
    await downloadFile(resumeUrl, tempPath);
    // Extract text
    let resumeText = await extractText(tempPath, ext);
    fs.unlinkSync(tempPath); // Clean up temp file
    if (!resumeText || resumeText.trim().length < 50)
        throw new apiError(400, "Could not extract enough text from resume");
    // --- Enhanced LLM prompt for targeted analysis ---
    let analysisContext = "";
    if (jobDescription) {
        analysisContext = `Compare the resume to the following job description for targeted analysis and ATS scoring: ${jobDescription}`;
    }
    else if (jobTitle) {
        analysisContext = `Analyze the resume for the role of: ${jobTitle}.`;
    }
    else {
        analysisContext = `Analyze the resume for the role(s) of: ${user.jobPreferences.join(", ")}.`;
    }
    // If multiple job preferences, ask for a match score/section for each
    const multiRoleInstruction = user.jobPreferences.length > 1 && !jobDescription
        ? `For each of the following roles: ${user.jobPreferences.join(", ")}, provide a match score (0-100) and a brief section of feedback specific to that role.`
        : "";
    const prompt = `${analysisContext}
  ${multiRoleInstruction}
  Return a JSON object with the following keys, each as an array of strings (or a string/number for summary fields):
    - strengths
    - weaknesses
    - missingSkills
    - improvementTips
    - languageAndTone
    - softSkills
    - portfolioReview
    - redFlags
    - recommendations
    - jobMarketFit
    - nextSteps
    - atsScore (number from 0-100, estimating how well the resume matches the job description or preferences for an ATS)
    - atsScoreExplanation (a brief explanation of the score and how to improve it)
    ${user.jobPreferences.length > 1 && !jobDescription ? `- roleMatchScores (an object mapping each role to a score and feedback, e.g. { "Backend Developer": { score: 85, feedback: "Good backend skills..." } })` : ""}
  For each, provide actionable, specific, and concise feedback. Resume text: ${resumeText}`;
    const completion = await openai.chat.completions.create({
        model: "moonshotai/kimi-dev-72b:free",
        messages: [
            { role: "system", content: `You are a professional career coach. Respond ONLY with a JSON object with keys: strengths, weaknesses, missingSkills, improvementTips, languageAndTone, softSkills, portfolioReview, redFlags, recommendations, jobMarketFit, nextSteps, atsScore, atsScoreExplanation${user.jobPreferences.length > 1 && !jobDescription ? ", roleMatchScores" : ""}. Do not include any text, explanation, or formatting outside the JSON. If you understand, reply only with the JSON.` },
            { role: "user", content: prompt }
        ]
    });
    const raw = completion.choices[0].message.content || "{}";
    console.log("LLM raw response:", raw);
    // Try to extract all JSON-like blocks (code-fenced or not)
    let analysis = null;
    let jsonBlocks = [];
    // 1. Code-fenced blocks
    let codeFenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/gi);
    if (codeFenceMatch && codeFenceMatch.length > 0) {
        jsonBlocks = codeFenceMatch.map(block => block.replace(/```(?:json)?/i, "").replace(/```/g, "").trim());
    }
    // 2. Any { ... } blocks (even outside code fences)
    let curlyMatches = raw.match(/\{[\s\S]*?\}/g);
    if (curlyMatches) {
        jsonBlocks = jsonBlocks.concat(curlyMatches.map(s => s.trim()));
    }
    // 3. Try to parse each block, last to first, after decoding HTML entities
    console.log("All extracted JSON blocks:", jsonBlocks);
    for (let i = jsonBlocks.length - 1; i >= 0; i--) {
        try {
            const decoded = decodeHtmlEntities(jsonBlocks[i]);
            const candidate = parseJson(decoded);
            if (isValidAnalysis(candidate)) {
                analysis = candidate;
                break;
            }
        }
        catch (e) {
            console.error("Parse error for block:", jsonBlocks[i], e);
            // continue
        }
    }
    // 4. Fallback: try to decode and parse the whole raw string
    if (!analysis) {
        try {
            const decoded = decodeHtmlEntities(raw);
            const candidate = parseJson(decoded);
            if (isValidAnalysis(candidate)) {
                analysis = candidate;
            }
        }
        catch (e) { }
    }
    if (!analysis) {
        console.error("Failed to parse LLM response. Raw output:", raw);
        console.error("All extracted JSON blocks:", jsonBlocks);
        throw new apiError(500, "Failed to parse LLM response: " + raw);
    }
    // --- New: Extract skills from resume text using LLM ---
    const skillExtractionPrompt = `Extract a list of technical and professional skills (languages, frameworks, tools, methodologies, etc.) from the following resume text. Respond ONLY with a valid JSON array of skill strings. Do NOT include any explanation, comments, or text outside the array. If you include anything else, your answer will be rejected. Resume text: ${resumeText}`;
    const skillExtractionCompletion = await openai.chat.completions.create({
        model: "moonshotai/kimi-dev-72b:free",
        messages: [
            { role: "system", content: "Extract skills from resume. Respond ONLY with a JSON array of skill strings." },
            { role: "user", content: skillExtractionPrompt }
        ]
    });
    let extractedSkills = [];
    try {
        const rawSkills = skillExtractionCompletion.choices[0].message.content || "[]";
        extractedSkills = parseJson(rawSkills);
        if (!Array.isArray(extractedSkills))
            extractedSkills = [];
        // Improved post-processing: filter out non-skill artifacts, long strings, sentences, and non-alphabetic entries
        const knownArtifacts = [
            "think", "okay", "NaN", "resume", "project", "let me", "provided", "scan", "section", "typo",
            "something else", "but", "which", "maybe", "intended", "corrected", "under", "achievements", "not skills", "platforms", "case", "any case", "else", "etc", "other"
        ];
        extractedSkills = extractedSkills.filter(skill => {
            if (typeof skill !== 'string')
                return false;
            const s = skill.trim();
            // Remove if too long, too short, or contains suspicious punctuation
            if (s.length < 2 || s.length > 32)
                return false;
            // Remove if contains known artifacts or is a sentence/fragment
            if (knownArtifacts.some(artifact => s.toLowerCase().includes(artifact)))
                return false;
            // Remove if contains more than 4 words
            if (s.split(/\s+/).length > 4)
                return false;
            // Remove if it looks like a sentence (ends with a period or has multiple clauses)
            if (/[\.!?]$/.test(s) || /,|;|:|\band\b|\bor\b|\bbut\b|\bif\b|\bthen\b|\bbecause\b|\bwith\b|\bfor\b|\bto\b|\bfrom\b|\bby\b|\bon\b|\bin\b|\bat\b|\bas\b|\bof\b|\bthe\b|\ba\b|\ban\b|\bis\b|\bare\b|\bwas\b|\bwere\b|\bbe\b|\bbeen\b|\bbeing\b|\bdo\b|\bdoes\b|\bdid\b|\bdone\b|\bdoing\b|\bhas\b|\bhave\b|\bhad\b|\bhaving\b|\bwill\b|\bwould\b|\bshall\b|\bshould\b|\bcan\b|\bcould\b|\bmay\b|\bmight\b|\bmust\b|\bought\b|\bneed\b|\bdare\b|\bused\b/.test(s))
                return false;
            // Remove if not mostly alphanumeric or tech symbols
            if (!/^[a-zA-Z0-9 .#+\/-]+$/.test(s))
                return false;
            return true;
        });
    }
    catch (e) {
        extractedSkills = [];
    }
    // Overwrite user.skills with only the extracted skills (deduplicated and trimmed)
    const existingSkills = Array.isArray(user.skills) ? user.skills : [];
    user.skills = Array.from(new Set([...existingSkills, ...extractedSkills.map(s => s.trim()).filter(Boolean)]));
    await user.save();
    // Store in user.aiInsights
    user.aiInsights = user.aiInsights || {};
    user.aiInsights.resumeAnalysis = analysis;
    user.aiInsights.lastAnalysisAt = new Date();
    await user.save();
    res.status(200).json(new apiResponse(200, analysis, "Resume analyzed successfully"));
});
