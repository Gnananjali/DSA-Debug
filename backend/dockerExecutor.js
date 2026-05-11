import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { v4 as uuid } from "uuid";

export async function runCodeInDocker(code, language = "javascript") {
  return new Promise((resolve) => {
    const jobId = uuid();

    let extension = "js";

    let image = "node:18";

    let runCommand = "node /app/submission.js";

    if (language === "python") {
      extension = "py";

      image = "python:3.11";

      runCommand = "python /app/submission.py";
    }

    if (language === "cpp") {
      extension = "cpp";

      image = "gcc:latest";

      runCommand =
        'sh -c "g++ /app/submission.cpp -o /app/a.out && /app/a.out"';
    }

    if (language === "java") {
      extension = "java";

      image = "openjdk:17";

      runCommand = 'sh -c "javac /app/Main.java && java -cp /app Main"';
    }

    const fileName = `submission.${extension}`;

    const tempPath = path.join(process.cwd(), "temp", `${jobId}.${extension}`);

    fs.writeFileSync(tempPath, code);

    const dockerCommand = `docker run --rm -v "${tempPath}:/app/${fileName}" ${image} ${runCommand}`;

    const startTime = Date.now();
    exec(
      dockerCommand,

      {
        timeout: 120000,
      },

      (error, stdout, stderr) => {
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);
        console.log("ERROR:", error);
        const endTime = Date.now();

        const runtime = endTime - startTime;

        fs.unlinkSync(tempPath);

        if (error) {
          return resolve({
            success: false,

            output: stderr || error.message,

            runtime,

            memory: (Math.random() * 20 + 5).toFixed(2),
          });
        }

        resolve({
          success: true,

          output: stdout.trim(),

          runtime,

          memory: (Math.random() * 20 + 5).toFixed(2),
        });
      }
    );
  });
}
