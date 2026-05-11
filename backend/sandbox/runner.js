const fs = require("fs");
const vm = require("vm");

try {
  const code = fs.readFileSync("/app/submission.js", "utf8");

  let output = "";

  const sandbox = {
    console: {
      log: (...args) => {
        output += args.join(" ") + "\n";
      },
    },
  };

  vm.createContext(sandbox);

  const script = new vm.Script(code);

  script.runInContext(sandbox, {
    timeout: 3000,
  });

  process.stdout.write(output);
} catch (err) {
  console.error("ERROR:", err.message);
}
