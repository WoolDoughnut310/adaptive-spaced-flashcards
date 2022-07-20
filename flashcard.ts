import { addDays } from "date-fns";
import * as uuid from "uuid";

const getIntervalDate = (interval: number, date?: Date) => {
    return addDays(date ?? new Date(), interval);
};

export interface IFlashcard {
    id: string; // To uniquely identify flashcards
    question: string; // The text that goes on the front of the card
    content: string; // The answer to the question
    easiness: number; // Reflects how easy it is to recall the content
    interval: number; // The number of days after which a review is need
    repetitions: number; // How many times the flashcard has been recalled correctly in a row
    nextReview: Date; // The earliest date we can review the flashcard
}

export const createFlashcard = (
    question: string,
    content: string
): IFlashcard => {
    return {
        id: uuid.v4(),
        question,
        content,
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date(), // So that we review it on the day of creation
    };
};

export const reviewFlashcard = (
    flashcard: IFlashcard,
    quality: number,
    reviewDate?: Date
) => {
    flashcard.repetitions++;

    let interval: number;
    switch (flashcard.repetitions) {
        case 1:
            interval = 1;
            break;
        case 2:
            interval = 6;
            break;
        default:
            interval = Math.round(flashcard.interval * flashcard.easiness);
    }

    let easiness =
        flashcard.easiness +
        (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    if (easiness < 1.3) {
        easiness = 1.3;
    }

    if (quality < 3) {
        interval = 1;
        flashcard.repetitions = 1;
    } else {
        flashcard.easiness = easiness;
    }

    flashcard.interval = interval;
    // Gets the next review date as the current date, `interval` days later
    flashcard.nextReview = getIntervalDate(interval, reviewDate);

    return quality < 4;
};
