import { formatISO } from "date-fns";
import * as readline from "readline";
import * as deck from "./deck";
import { createFlashcard } from "./flashcard";

const QUIT_WORD = "quit";
const qualityMap = [5, 3, 1, 0];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Can only save if a deck has been loaded from a file initially
rl.on("close", () => {
    if (deck.source) deck.save();
    console.log("Thank you. Good bye!");
});

const prompt = (prompt: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        rl.question(prompt, resolve);
    });
};

// Closes the input stream to save the deck file, and exits NodeJS
const quit = () => {
    rl.close();
    return process.exit(22);
};

const printHelp = () => {
    console.log(`
        help                : Outputs all information about commands
        quit                : Exits the program
        stats               : Outputs information about the current deck
        load (filePath)     : Loads a deck file from filePath
        save (filePath?)    : Saves the deck to the file at filePath
        create              : Starts a dialog to create a flashcard
        clear               : Clears all flashcards and empties the deck
        start               : Starts a study session (use "quit" to end)
    `);
};

const printStats = () => {
    const source = deck.source || "None";
    const totalFlashcards = Object.keys(deck.flashcards).length;
    const lastOpened = formatISO(deck.lastSeen, { representation: "date" });
    const currentStack = deck.stack.length;

    console.log(`
        Source: ${source}
        Total flashcards: ${totalFlashcards}
        Last opened: ${lastOpened}
        Current stack: ${currentStack}
    `);
};

const run = async () => {
    // Displays a prompt to the user
    var answer = await prompt("> ");

    // Parse the user's input into the needed parts
    let parts = answer.split(" ");
    if (parts.length === 0) return;

    const command = parts[0];
    const args = parts.slice(1);

    try {
        await executeCommand(command, args);
    } catch (error) {
        console.log(`Invalid arguments provided. ${error}`);
    }
};

const executeCommand = async (command: string, args: string[]) => {
    switch (command) {
        case "help":
            printHelp();
            break;
        case QUIT_WORD:
            quit();
            break;
        case "stats":
            printStats();
            break;
        case "load":
            if (args.length !== 1) {
                throw new Error();
            }

            deck.load(args[0]);
            console.log("Deck loaded.");
            break;
        case "save":
            // There can only be 1 or no arguments provided
            if (args.length > 1) {
                throw new Error();
            }

            deck.save(args[0]);
            console.log("Deck saved.");
            break;
        case "create":
            const question = await prompt("Question: ");
            const content = await prompt("Content: ");

            const newFlashcard = createFlashcard(question, content);
            deck.addFlashcard(newFlashcard);
            console.log("Flashcard created.");
            break;
        case "clear":
            const response = await prompt("Confirm (y/n): ");
            if (response.toLowerCase() === "y") {
                deck.clearFlashcards();
                console.log("Deck cleared.");
            }
            break;
        case "start":
            if (Object.keys(deck.flashcards).length === 0) {
                console.log("No flashcards have been added.");
                return;
            }

            if (deck.stack.length === 0) {
                console.log("Stack is empty. Come back later.");
                return;
            }

            console.log("Session started.");
            while (true) {
                const flashcard = deck.getNextQuestion();

                if (flashcard === null) {
                    console.log("Stack is empty. Come back later.");
                    break;
                }

                try {
                    // Displays the question, user sees it and thinks of the answer
                    let response = await prompt(flashcard.question + "\n");

                    // Allows exiting from flashcard session with `QUIT_WORD`
                    if (response === QUIT_WORD) break;

                    // Answer is displayed to the user
                    console.log(flashcard.content);

                    const quality = await prompt(
                        `Recall quality (1 - ${qualityMap.length}): `
                    );
                    if (quality === QUIT_WORD) break;

                    // If the input is not numerical
                    if (isNaN(Number(quality))) throw new Error();

                    // Converts string to number, and changes (1 -> n) to (0 -> n - 1)
                    deck.assessFlashcard(
                        flashcard.id,
                        qualityMap[parseInt(quality) - 1]
                    );
                } catch {
                    console.log("Invalid arguments provided.");
                }
            }
            break;
        default:
            console.log("Invalid command.");
            break;
    }
};

(async () => {
    while (true) {
        await run();
    }
})();
