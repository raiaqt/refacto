import { OpenAI } from "openai";
import * as fs from "fs";

type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function refactorReact(filePath: string, fileContent: string): Promise<void> {
    const messages: ChatMessage[] = [
        {
            role: "system",
            content: "You are an assistant that refactors legacy code."
        },
        {
            role: "user",
            content:
                "Refactor the following legacy React class component code to modern standards:\n" +
                "- Convert all class components into functional components.\n" +
                "- Convert the code from JavaScript to TypeScript (tsx) syntax.\n" +
                "- Do not modify internal import statements; retain the original filenames and extensions.\n" +
                "- Apply modern React, TypeScript, and frontend best practices.\n" +
                "- Return only code in your response, without any markdown formatting or extra commentary.\n" +
                "- Respond with text format, not markdown.\n" +
                "File content:\n" +
                fileContent
        }
    ];

    let result: string | undefined;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 0
        });
        result = completion.choices[0].message?.content ?? undefined;
        if (!result) {
            throw new Error("No output from gpt-3.5-turbo");
        }
    } catch (error: any) {
        console.error(`GPT-3.5-turbo refactor failed for ${filePath}: ${error.message}`);
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages,
                temperature: 0
            });
            result = completion.choices[0].message?.content ?? undefined;
            if (!result) {
                throw new Error("No output from gpt-4");
            }
        } catch (error2: any) {
            console.error(`GPT-4 refactor also failed for ${filePath}: ${error2.message}`);
            return;
        }
    }
    fs.writeFileSync(filePath, result, "utf8");
    console.log(`Refactored React component saved: ${filePath}`);
}

export async function refactorJavascript(filePath: string, fileContent: string): Promise<void> {
    const messages: ChatMessage[] = [
        {
            role: "system",
            content: "You are an assistant that refactors legacy code."
        },
        {
            role: "user",
            content:
                "Refactor the following JavaScript code to modern standards:\n" +
                "- Convert the code from JavaScript to TypeScript (ts) syntax.\n" +
                "- Use modern JavaScript/TypeScript features and ensure type safety.\n" +
                "- Remove any usage of PropTypes if present, replacing them with appropriate TypeScript types.\n" +
                "- Optimize functions and definitions for clarity and maintainability.\n" +
                "- Retain original import statements without changes.\n" +
                "- Return only code in your response, without any markdown formatting or extra commentary.\n" +
                "- Respond with text format, not markdown.\n" +
                "File content:\n" +
                fileContent
        }
    ];

    let result: string | undefined;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 0
        });
        result = completion.choices[0].message?.content ?? undefined;
        if (!result) {
            throw new Error("No output from gpt-3.5-turbo");
        }
    } catch (error: any) {
        console.error(`GPT-3.5-turbo refactor failed for ${filePath}: ${error.message}`);
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages,
                temperature: 0
            });
            result = completion.choices[0].message?.content ?? undefined;
            if (!result) {
                throw new Error("No output from gpt-4");
            }
        } catch (error2: any) {
            console.error(`GPT-4 refactor also failed for ${filePath}: ${error2.message}`);
            return;
        }
    }
    fs.writeFileSync(filePath, result, "utf8");
    console.log(`Refactored JavaScript file saved: ${filePath}`);
} 