export function generateExplanation(analysis) {
  if (analysis.nestedLoopDetected) {
    return `
This algorithm has nested loops.

Each loop iterates over the dataset,
resulting in quadratic time complexity O(n²).

For larger inputs, performance may degrade significantly.
        `;
  }

  if (analysis.recursionDetected) {
    return `
This algorithm uses recursion.

Recursive solutions can be elegant,
but may increase memory usage due to stack calls.

Consider memoization for optimization.
        `;
  }

  if (analysis.loopCount === 1) {
    return `
This algorithm contains a single loop.

The estimated complexity is O(n),
which is generally efficient for large datasets.
        `;
  }

  return `
The algorithm appears to run in constant time O(1).

No major iteration or recursion patterns were detected.
    `;
}
