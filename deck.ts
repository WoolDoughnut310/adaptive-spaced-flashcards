import { differenceInCalendarDays, isToday } from "date-fns";
import { readFileSync, writeFileSync } from "fs";
import { IFlashcard, reviewFlashcard } from "./flashcard";

export let lastSeen: Date = new Date(); // The last date the deck had been loaded
export let stack: string[] = []; // The current flashcards to be reviewed for the day
export let flashcards: {
    [key: string]: IFlashcard;
} = {}; // All the flashcards from a deck file

export let source: string; // The current filepath to the deck file

export const load = (filePath: string) => {
    source = filePath;

    const rawData = readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData);

    // Updating the deck in memory with data from the file
    lastSeen = data.lastSeen;

    if (isToday(lastSeen)) {
        // Use the previously saved stack
        stack = data.stack;
    } else {
        // The stack resets after each day
        stack = getInitialStack();
    }

    flashcards = data.flashcards;
};

export const save = (filePath?: string) => {
    if (source === undefined) {
        // This error can be caught inside the main application code
        throw new Error("No flashcards file has been opened.");
    }

    // Save all deck data to `filePath` or the current deck's filePath
    filePath = filePath ?? source;

    const data = {
        lastSeen: new Date(),
        stack,
        flashcards,
    };

    writeFileSync(filePath, JSON.stringify(data), "utf-8");
};

export const getNextQuestion = (): IFlashcard | null => {
    // Removes the ID at the start of the stack and returns it
    const nextFlashcardId = stack.shift();

    if (nextFlashcardId) {
        return flashcards[nextFlashcardId];
    }

    return null;
};

export const assessFlashcard = (flashcardId: string, quality: number) => {
    if (reviewFlashcard(flashcards[flashcardId], quality)) {
        stack.push(flashcardId);
    }
};

export const addFlashcard = (flashcard: IFlashcard) => {
    const flashcardId = flashcard.id;

    flashcards[flashcardId] = flashcard;
    stack.push(flashcardId);
};

export const clearFlashcards = () => {
    // Go through each key of the object
    for (let flashcardId of Object.keys(flashcards)) {
        delete flashcards[flashcardId];
    }

    // Removes all items
    stack.length = 0;
};

const getInitialStack = (): string[] => {
    let queue: string[] = [];

    for (let flashcard of Object.values(flashcards)) {
        // Is the next review date for the flashcard in the past?
        if (differenceInCalendarDays(new Date(), flashcard.nextReview) <= 0) {
            queue.push(flashcard.id);
        }
    }

    return queue;
};
