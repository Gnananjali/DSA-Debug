import esprima from "esprima";

export function analyzeComplexity(code) {
  const ast = esprima.parseScript(code);

  let loopCount = 0;
  let nestedLoopDetected = false;
  let recursionDetected = false;
  let functionName = null;

  function traverse(node, depth = 0) {
    if (!node || typeof node !== "object") {
      return;
    }

    // Detect function declarations
    if (node.type === "FunctionDeclaration") {
      functionName = node.id.name;
    }

    // Detect recursive calls
    if (
      node.type === "CallExpression" &&
      node.callee &&
      node.callee.name === functionName
    ) {
      recursionDetected = true;
    }

    // Detect loops
    if (
      node.type === "ForStatement" ||
      node.type === "WhileStatement" ||
      node.type === "ForOfStatement" ||
      node.type === "ForInStatement"
    ) {
      loopCount++;

      if (depth >= 1) {
        nestedLoopDetected = true;
      }

      depth++;
    }

    // Traverse child nodes
    for (const key in node) {
      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach((c) => traverse(c, depth));
      } else {
        traverse(child, depth);
      }
    }
  }

  traverse(ast);

  let complexity = "O(1)";

  if (loopCount === 1) {
    complexity = "O(n)";
  }

  if (nestedLoopDetected) {
    complexity = "O(n²)";
  }

  if (recursionDetected) {
    complexity = "O(recursive)";
  }

  return {
    loopCount,
    nestedLoopDetected,
    recursionDetected,
    estimatedComplexity: complexity,
  };
}
