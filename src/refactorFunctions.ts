import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";

type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

/**
 * Checks if the file is within a "__tests__" directory.
 * @param filePath - The file path.
 * @returns True if the file is considered a test file.
 */
function isTestFile(filePath: string): boolean {
    return filePath.split(path.sep).includes("__tests__");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Delays execution for a specified number of milliseconds.
 * @param ms - Milliseconds to delay.
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempts to refactor code with the specified AI model using retry logic.
 * @param filePath - The path of the current file.
 * @param messages - The messages provided to the AI.
 * @param model - The AI model to use.
 * @param maxRetries - Maximum number of attempts.
 * @param delayTimeMs - Delay time between attempts in milliseconds.
 * @returns The refactored code.
 * @throws If all attempts fail.
 */
async function attemptRefactorWithModel(
    filePath: string,
    messages: ChatMessage[],
    model: string,
    maxRetries: number,
    delayTimeMs: number
): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const completion = await openai.chat.completions.create({
                model,
                messages,
            });
            const result = completion.choices[0].message?.content;
            if (result) {
                return result;
            }
            throw new Error(`No output from ${model}`);
        } catch (error: any) {
            console.error(`Attempt ${attempt} with model ${model} failed for ${filePath}: ${error.message}`);
            if (attempt < maxRetries) {
                await delay(delayTimeMs);
            }
        }
    }
    throw new Error(`All ${maxRetries} attempts failed with model ${model} for ${filePath}`);
}

/**
 * Attempts to refactor code using a primary AI model with retries and,
 * if it fails, using a fallback model ("o3") with its own retries.
 * @param filePath - The path of the current file.
 * @param messages - The messages provided to the AI.
 * @returns An object containing the refactored code and a flag indicating if a fallback was used.
 * @throws If all attempts (for both models) fail.
 */
async function getRefactoredCode(filePath: string, messages: ChatMessage[]): Promise<{ code: string, retried: boolean }> {
    const primaryModel = "o3-mini";
    const fallbackModel = "gpt-4o";
    const maxRetries = 3;
    const delayTimeMs = 1000;

    try {
        const code = await attemptRefactorWithModel(filePath, messages, primaryModel, maxRetries, delayTimeMs);
        return { code, retried: false };
    } catch (primaryError: any) {
        console.error(`Primary model ${primaryModel} failed for ${filePath}: ${primaryError.message}`);
        const code = await attemptRefactorWithModel(filePath, messages, fallbackModel, maxRetries, delayTimeMs);
        return { code, retried: true };
    }
}

/**
 * Saves the refactored file with a new extension.
 * @param filePath - The original file path.
 * @param newExtension - The new file extension (e.g., ".tsx" or ".ts").
 * @param content - The refactored code content.
 */
function saveRefactoredFile(filePath: string, newExtension: string, content: string): void {
    const parsed = path.parse(filePath);
    const newFilePath = path.join(parsed.dir, parsed.name + newExtension);
    fs.writeFileSync(newFilePath, content, "utf8");
    if (newFilePath !== filePath) {
        fs.unlinkSync(filePath);
    }
    console.log(`Refactored file saved: ${newFilePath}`);
}

export async function refactorReact(filePath: string, fileContent: string): Promise<{ success: boolean, retried: boolean }> {
    if (isTestFile(filePath)) {
        console.log(`Skipping file in __tests__ directory: ${filePath}`);
        return { success: false, retried: false };
    }

    const instruction =
        "Refactor the following legacy React class component code to modern standards:\n" +
        "- Convert all class components into functional components.\n" +
        "- Convert the code from JavaScript to TypeScript (tsx) syntax.\n" +
        "- Do not modify internal import statements; retain the original filenames and extensions.\n" +
        "- Apply modern React, TypeScript, and frontend best practices.\n" +
        "- Return only code in your response, without any markdown formatting or extra commentary.\n" +
        "- Respond with text format, not markdown.\n" +
        "File content:\n" +
        fileContent;

    const messages: ChatMessage[] = [
        {
            role: "system",
            content: "You are an assistant that refactors legacy code."
        },
        {
            role: "user",
            content: instruction
        }
    ];

    try {
        const { code, retried } = await getRefactoredCode(filePath, messages);
        saveRefactoredFile(filePath, ".tsx", code);
        return { success: true, retried };
    } catch (error: any) {
        console.error(`Refactoring failed for ${filePath}: ${error.message}`);
        return { success: false, retried: false };
    }
}

export async function refactorJavascript(filePath: string, fileContent: string): Promise<{ success: boolean, retried: boolean }> {
    if (isTestFile(filePath)) {
        console.log(`Skipping file in __tests__ directory: ${filePath}`);
        return { success: false, retried: false };
    }

    const instruction =
        "Refactor the following JavaScript code to modern standards:\n" +
        "- Convert the code from JavaScript to TypeScript (ts) syntax.\n" +
        "- Use modern JavaScript/TypeScript features and ensure type safety.\n" +
        "- Optimize functions and definitions for clarity and maintainability.\n" +
        "- Retain original import statements without changes.\n" +
        "- Return only code in your response, without any markdown formatting or extra commentary.\n" +
        "- Respond with text format, not markdown.\n" +
        "File content:\n" +
        fileContent;

    const messages: ChatMessage[] = [
        {
            role: "system",
            content: "You are an assistant that refactors legacy code."
        },
        {
            role: "user",
            content: instruction
        }
    ];

    try {
        const { code, retried } = await getRefactoredCode(filePath, messages);
        saveRefactoredFile(filePath, ".ts", code);
        return { success: true, retried };
    } catch (error: any) {
        console.error(`Refactoring failed for ${filePath}: ${error.message}`);
        return { success: false, retried: false };
    }
}
