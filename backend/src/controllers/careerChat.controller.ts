import { Request, Response, NextFunction } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const careerChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }
    const completion = await openai.chat.completions.create({
      model: "moonshotai/kimi-dev-72b:free",
      messages: [
        { role: "system", content: "You are a professional career coach. Answer as concisely as possible. Use a numbered or bulleted list with a maximum of one short line per item. Be brief, direct, and businesslike. Avoid extra commentary or repetition." },
        { role: "user", content: prompt }
      ]
    });
    res.json({ result: completion.choices[0].message.content });
  } catch (err: any) {
    next(err);
  }
}; 