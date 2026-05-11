export function generateSuggestions(analysis) {
  const suggestions = [];

  if (analysis.nestedLoopDetected) {
    suggestions.push(
      "Nested loops detected. Consider using HashMap or Set to optimize lookup operations."
    );
  }

  if (analysis.recursionDetected) {
    suggestions.push(
      "Recursion detected. Consider memoization or dynamic programming for optimization."
    );
  }

  if (analysis.loopCount === 1) {
    suggestions.push("Single loop detected. Complexity appears efficient.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Code complexity appears optimal.");
  }

  return suggestions;
}
