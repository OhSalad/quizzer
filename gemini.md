# Quizzer Website

This website is a simple, self-study quiz application that allows users to load their own questions from a JSON file.

## How it Works

1.  **Load Questions:** The user selects a JSON file containing the quiz questions.
2.  **Start Quiz:** The quiz starts, and the questions are displayed one by one.
3.  **Timer:** Each question has a 10-second timer. If the user doesn't answer within the time limit, the question is marked as incorrect.
4.  **Answering Questions:** The user selects an answer for each question.
    *   The correct answer is highlighted in green.
    *   The selected incorrect answer is highlighted in red.
5.  **Results:** At the end of the quiz, the user's score and the total time taken are displayed.
6.  **Retake:** The user can retake the quiz.

## JSON Structure for Questions

To create a question list, use the following JSON structure:

```json
[
    {
        "question": "What is the capital of France?",
        "options": ["London", "Paris", "Berlin", "Madrid"],
        "answer": "Paris"
    },
    {
        "question": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "answer": "4"
    }
]
```

Each question is an object in an array. The object must have the following keys:

*   `"question"`: The question text (string).
*   `"options"`: An array of strings representing the possible answers.
*   `"answer"`: The correct answer (string).
