import { IFlashcard, createFlashcard, reviewFlashcard } from "./flashcard";
import { formatISO } from "date-fns"; // So that we can see the dates nicely

const formatDate = (date: Date) => {
    return formatISO(date, { representation: "date" });
};

// Output the current state of the updated flashcard
const printStatus = () => {
    console.log(`The easiness factor has changed to ${flashcard.easiness}`);
    console.log(`The next review date is ${formatDate(flashcard.nextReview)}`);

    if (revisit) {
        console.log(
            "This flashcard needs revisiting at the end of today's session"
        );
    } else {
        console.log("This flashcard does not need revisiting");
    }

    console.log();
};

let question = "When was ECMAScript 6 first released?";
let content = "June 2015";

// Creating a flashcard
let flashcard: IFlashcard = createFlashcard(question, content);

console.log(flashcard);
// Returns the default values from `flashcard.ts`

// Let's review the card
let quality = 5; // perfect response

let currentDate = new Date();

// Make a review and mutate the flashcard
let revisit = reviewFlashcard(flashcard, quality, currentDate);

printStatus();

// Travelling in time to the next review date
currentDate = flashcard.nextReview;

// The information just slipped away from us
quality = 2; // incorrect response; the correct one remembered

revisit = reviewFlashcard(flashcard, quality, currentDate);

printStatus();

currentDate = flashcard.nextReview;

// Now we get slightly better
quality = 3; // correct response recalled with serious difficulty

revisit = reviewFlashcard(flashcard, quality, currentDate);

printStatus();

// Final review day
currentDate = flashcard.nextReview;

quality = 4; // correct response after a hesitation

revisit = reviewFlashcard(flashcard, quality, currentDate);

printStatus();
