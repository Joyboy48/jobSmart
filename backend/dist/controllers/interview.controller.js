import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import Tesseract from "tesseract.js";
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});
// Define default question sets
const defaultQuestionSets = {
    technical: [
        "Tell me about a challenging technical problem you've solved.",
        "What programming languages are you most comfortable with?",
        "Describe your experience with version control systems.",
    ],
    hr: [
        "Why do you want to work at our company?",
        "How do you handle conflict in the workplace?",
        "Describe a time you worked in a team.",
    ],
    behavioral: [
        "Tell me about a time you showed leadership.",
        "Describe a situation where you had to adapt quickly.",
        "How do you prioritize your tasks?",
    ],
};
// In-memory session store (for MVP)
const sessions = {};
// Utility to clean LLM output of commentary/thinking tags
function cleanLLMOutput(text) {
    return text
        .split('\n')
        .filter(line => !line.trim().startsWith('◁think▷') &&
        !line.trim().startsWith('◁/think▷') &&
        !line.trim().toLowerCase().startsWith('thinking:'))
        .join('\n')
        .trim();
}
// Utility to extract only the first non-empty line as the pure question
function extractPureQuestion(text) {
    const lines = cleanLLMOutput(text)
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .filter(line => !line.toLowerCase().includes('think') &&
        !line.toLowerCase().includes('reason') &&
        !line.toLowerCase().includes('task is') &&
        !line.toLowerCase().includes('now,') &&
        !line.toLowerCase().startsWith('first,') &&
        line.length > 10);
    // Prefer lines that look like questions
    const questionLine = lines.find(line => line.endsWith('?') ||
        /^(what|how|describe|tell|can you|did you|have you|explain|which|why|when|where|who)/i.test(line));
    return questionLine || (lines.length > 0 ? lines[0] : '');
}
// Update extractFirstJsonBlock to truncate feedback to the first sentence
function extractFirstJsonBlock(text) {
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
        try {
            const obj = JSON.parse(match[0]);
            // Truncate feedback to first sentence if needed
            if (obj.feedback) {
                obj.feedback = obj.feedback.split('. ')[0] + (obj.feedback.includes('.') ? '.' : '');
            }
            return obj;
        }
        catch (e) { }
    }
    return { feedback: text.trim() };
}
// Helper to download a file
async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Failed to download file: ${url}`);
    const fileStream = fs.createWriteStream(dest);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", () => resolve());
    });
}
// Helper to extract text from PDF
async function extractTextFromPDF(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + " ";
    }
    return text.replace(/\s+/g, " ").trim();
}
// Helper to extract text from DOCX
async function extractTextFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.replace(/\s+/g, " ").trim();
}
// Helper to get file extension
function getFileExtension(url) {
    return path.extname(url).toLowerCase();
}
// Start a new interview session (with type/customQuestions)
export const startInterview = asyncHandler(async (req, res) => {
    const { type = "technical", customQuestions, role } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user)
        throw new apiError(404, "User not found");
    // Parse resume
    let resumeText = "";
    let resumeStatus = "parsed";
    try {
        if (user.resumeUrl) {
            let resumeUrl = user.resumeUrl;
            if (resumeUrl.startsWith("http://"))
                resumeUrl = resumeUrl.replace("http://", "https://");
            const ext = getFileExtension(resumeUrl);
            const tempPath = `./temp_resume_${userId}${ext}`;
            await downloadFile(resumeUrl, tempPath);
            if (ext === ".pdf") {
                resumeText = await extractTextFromPDF(tempPath);
            }
            else if (ext === ".docx") {
                resumeText = await extractTextFromDocx(tempPath);
            }
            else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
                // OCR for image resumes
                const ocrResult = await Tesseract.recognize(tempPath, "eng");
                resumeText = ocrResult.data.text.replace(/\s+/g, " ").trim();
                if (!resumeText || resumeText.length < 20) {
                    resumeText = "Resume image could not be parsed or is too short.";
                    resumeStatus = "parse_error";
                }
            }
            else {
                resumeText = "Resume format not supported for parsing.";
                resumeStatus = "parse_error";
            }
            fs.unlinkSync(tempPath);
        }
        else {
            resumeText = "No resume found.";
            resumeStatus = "not_found";
        }
    }
    catch (err) {
        console.error("Resume parsing error:", err);
        resumeText = "Resume could not be parsed.";
        resumeStatus = "parse_error";
    }
    // If resume parsing failed, return error and do not start interview
    if (resumeStatus !== "parsed") {
        throw new apiError(400, "Resume not found or could not be parsed. Please upload a valid PDF or DOCX resume.");
    }
    let firstQuestion = "Tell me about yourself.";
    let questionSet = [];
    if (Array.isArray(customQuestions) && customQuestions.length > 0) {
        questionSet = customQuestions;
        firstQuestion = customQuestions[0];
    }
    else if (defaultQuestionSets[type]) {
        questionSet = defaultQuestionSets[type];
        firstQuestion = questionSet[0];
    }
    if (role && typeof role === "string" && role.trim().length > 0) {
        firstQuestion = `Let's start your interview for the ${role} position. Tell me about yourself.`;
    }
    const sessionId = uuidv4();
    const now = Date.now();
    sessions[sessionId] = {
        type,
        customQuestions: questionSet.length > 0 ? questionSet : undefined,
        questions: [{ q: firstQuestion, a: null, askedAt: now }],
        startedAt: now,
        role,
        resumeText,
        resumeStatus,
    };
    res.status(200).json(new apiResponse(200, { sessionId, question: firstQuestion }, `Interview started${role ? ` for ${role}` : ''} (${type})`));
});
// Receive answer, generate next question
export const answerInterview = asyncHandler(async (req, res) => {
    const { sessionId, answer } = req.body;
    if (!sessionId || !sessions[sessionId])
        throw new apiError(404, "Session not found");
    if (!answer)
        throw new apiError(400, "Answer is required");
    const session = sessions[sessionId];
    // Store answer and time
    const lastQA = session.questions[session.questions.length - 1];
    lastQA.a = answer;
    lastQA.answeredAt = Date.now();
    const timeTaken = lastQA.answeredAt - (lastQA.askedAt || lastQA.answeredAt);
    // Ask LLM for score and feedback (include role and resumeText, strict single-line JSON)
    const scoringPrompt = `Role: ${session.role || "N/A"}\nResume: ${session.resumeText || "N/A"}\nQuestion: ${lastQA.q}\nAnswer: ${answer}\nRespond ONLY as a single-line JSON object: {\\"score\\": number, \\"feedback\\": string}. The feedback must be a single, short sentence. Do NOT include any commentary, explanation, or extra text. Output ONLY the JSON, nothing else.`;
    const scoringCompletion = await openai.chat.completions.create({
        model: "moonshotai/kimi-dev-72b:free",
        messages: [{ role: "user", content: scoringPrompt }],
    });
    let score = undefined;
    let feedback = undefined;
    try {
        const scoring = extractFirstJsonBlock(scoringCompletion.choices[0].message.content || "{}");
        score = scoring.score;
        feedback = scoring.feedback;
    }
    catch (e) {
        feedback = cleanLLMOutput(scoringCompletion.choices[0].message.content?.trim() || "");
    }
    lastQA.score = score;
    lastQA.feedback = feedback;
    // Generate next question
    let nextQuestion = "";
    let isFollowup = false;
    if (session.questions.length === 1) {
        // This is the first answer, so generate a resume-based question for the second question
        const resumeBasedPrompt = `The interview is for the role: ${session.role || "N/A"}.\nCandidate's resume: ${session.resumeText || "N/A"}\nQ1: ${session.questions[0].q}\nA1: ${session.questions[0].a}\nAsk a short, specific, resume-based interview question about the candidate's experience, projects, or skills. Respond ONLY with the direct interview question, nothing else. Do NOT include any commentary, reasoning, explanation, or extra text. Output ONLY the question, and ensure it is a direct, interview-style question.`;
        const completion = await openai.chat.completions.create({
            model: "moonshotai/kimi-dev-72b:free",
            messages: [{ role: "user", content: resumeBasedPrompt }],
        });
        nextQuestion = extractPureQuestion(completion.choices[0].message.content?.trim() || "Thank you for your answer.");
        isFollowup = false;
    }
    else {
        // For all other questions, use the normal dynamic Q&A prompt
        const history = session.questions.map((qa, i) => `Q${i + 1}: ${qa.q}\nA${i + 1}: ${qa.a || ""}`).join("\n");
        const roleContext = session.role ? `The interview is for the role: ${session.role}.` : "";
        const resumeContext = session.resumeText ? `Candidate's resume: ${session.resumeText}` : "";
        const followupPrompt = `${roleContext}\n${resumeContext}\n${history}\nIf the last answer is incomplete or could use more detail, ask a short, simple, clear follow-up interview question (max 1 line). Otherwise, move to the next topic with a short, simple, clear interview question (max 1 line). Respond ONLY with the direct interview question, nothing else. Do NOT include any commentary, reasoning, explanation, or extra text. Output ONLY the question, and ensure it is a direct, interview-style question.`;
        const completion = await openai.chat.completions.create({
            model: "moonshotai/kimi-dev-72b:free",
            messages: [{ role: "user", content: followupPrompt }],
        });
        nextQuestion = extractPureQuestion(completion.choices[0].message.content?.trim() || "Thank you for your answer.");
        // Heuristic: If the next question is very similar to the last, it's likely a follow-up
        if (nextQuestion && lastQA.q) {
            const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (norm(nextQuestion).includes(norm(lastQA.q).slice(0, 10))) {
                isFollowup = true;
            }
            else if (nextQuestion.toLowerCase().includes("can you elaborate") || nextQuestion.toLowerCase().includes("please provide more detail")) {
                isFollowup = true;
            }
        }
    }
    // Store next question with askedAt
    session.questions.push({ q: nextQuestion, a: null, askedAt: Date.now() });
    res.status(200).json(new apiResponse(200, { question: nextQuestion, score, feedback, timeTaken, isFollowup }, "Next question generated with feedback, timing, and follow-up detection"));
});
// End interview, return summary
export const endInterview = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId || !sessions[sessionId])
        throw new apiError(404, "Session not found");
    const session = sessions[sessionId];
    // Build a focused, concise analysis prompt (no learningResources)
    const analysisPrompt = `Role: ${session.role || "N/A"}
Resume: ${session.resumeText || "N/A"}
${session.questions.map((qa, i) => `Q${i + 1}: ${qa.q}\nA${i + 1}: ${qa.a || ""}`).join("\n")}

Provide a concise interview analysis as a single JSON object with the following keys:
- strengths: array of up to 3 short bullet points (max 10 words each)
- weaknesses: array of up to 3 short bullet points (max 10 words each)
- summary: a single short paragraph (max 2 sentences)
- resumeComparison: array of up to 3 short bullet points (max 15 words each) comparing the candidate's answers to their resume

Respond ONLY with the JSON object, nothing else. Do NOT include any commentary, code fences, or extra text.`;
    const completion = await openai.chat.completions.create({
        model: "moonshotai/kimi-dev-72b:free",
        messages: [{ role: "user", content: analysisPrompt }],
    });
    let report = extractFirstJsonBlock(completion.choices[0].message.content || "");
    // Truncate arrays and summary for brevity
    if (report.strengths)
        report.strengths = report.strengths.slice(0, 3);
    if (report.weaknesses)
        report.weaknesses = report.weaknesses.slice(0, 3);
    if (report.resumeComparison)
        report.resumeComparison = report.resumeComparison.slice(0, 3);
    if (report.summary && typeof report.summary === 'string') {
        report.summary = report.summary.split('. ').slice(0, 2).join('. ') + (report.summary.includes('.') ? '.' : '');
    }
    // If resume parsing failed, set resumeComparison to a helpful message
    if (session.resumeStatus !== "parsed") {
        report.resumeComparison = [
            "Resume not found or could not be parsed. Please upload a valid PDF or DOCX resume."
        ];
    }
    // Optionally, delete session
    delete sessions[sessionId];
    res.status(200).json(new apiResponse(200, report, "Interview analysis and report generated"));
});
