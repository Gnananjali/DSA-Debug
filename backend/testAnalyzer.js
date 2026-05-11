import { analyzeComplexity } from "./analyzer.js";

const code = `
for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
        console.log(i, j);
    }
}
`;

const result = analyzeComplexity(code);

console.log(result);
