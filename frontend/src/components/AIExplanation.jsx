export function generateAIExplanation({

    code,
    complexity,
    suggestions

}) {

    let explanation = "";

    // Complexity explanation
    explanation += `
Estimated Time Complexity: ${complexity}
\n
`;

    // Detect hashmap usage
    if (
        code.includes("Map") ||
        code.includes("HashMap")
    ) {

        explanation += `
This solution uses a HashMap for fast lookups.

HashMaps reduce repeated searching
and improve performance significantly.
\n
`;
    }

    // Detect loops
    if (code.includes("for")) {

        explanation += `
The algorithm iterates through the dataset
using loops to process elements efficiently.
\n
`;
    }

    // Detect recursion
    if (code.includes("return")) {

        explanation += `
The solution returns results immediately
after finding the required condition.
\n
`;
    }

    // Suggestions
    if (suggestions?.length) {

        explanation += `
Possible Improvements:
`;

        suggestions.forEach((s) => {
            explanation += `- ${s}\n`;
        });
    }

    return explanation;
}