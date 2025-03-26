import * as fs from "fs";
import * as path from "path";
import { refactorReact, refactorJavascript } from "./refactorFunctions";
import dotenv from 'dotenv';

dotenv.config();

// A simple function to determine if a JS file is a React component
function isReactComponent(content: string): boolean {
    // Check for an import of React or a class that extends React.Component/Component.
    return /import\s+React\b/.test(content) ||
        /extends\s+React\.Component\b/.test(content) ||
        /extends\s+Component\b/.test(content);
}

// Recursively walk through the directory and process the files accordingly
async function processFiles(dir: string): Promise<void> {
    const files: string[] = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath: string = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await processFiles(fullPath);
        } else {
            // If the file is a test file, ignore it.
            if (file.endsWith(".test.js")) {
                console.log(`Skipping test file: ${fullPath}`);
                continue;
            }
            // Only process JavaScript files.
            if (path.extname(file) === ".js") {
                const content: string = fs.readFileSync(fullPath, "utf8");
                if (isReactComponent(content)) {
                    await refactorReact(fullPath, content);
                } else {
                    await refactorJavascript(fullPath, content);
                }
            }
        }
    }
}

// Determine the input folder from a command line argument.
// Usage example: `node dist/refactorFiles.js /path/to/project/input`
const inputFolder: string = process.argv[2] || path.join(__dirname, "input");

console.log(`Processing files in: ${inputFolder}`);

processFiles(inputFolder)
    .then(() => {
        console.log("Processing complete.");
    })
    .catch((error) => {
        console.error("Error processing files:", error);
    }); 