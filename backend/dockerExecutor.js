import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { v4 as uuid } from "uuid";

export async function runCodeInDocker(
  code,
  language = "python"
) {
  return new Promise((resolve) => {

    const jobId = uuid();

    let extension = "py";

    let command = "";

    if (language === "python") {
      extension = "py";
      command = "python";
    }

    if (language === "javascript") {
      extension = "js";
      command = "node";
    }

    const tempDir = path.join(
      process.cwd(),
      "temp"
    );

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, {
        recursive: true,
      });
    }

    const tempPath = path.join(
      tempDir,
      `${jobId}.${extension}`
    );

    fs.writeFileSync(tempPath, code);

    const startTime = Date.now();

    exec(
      `${command} ${tempPath}`,

      {
        timeout: 10000,
      },

      (error, stdout, stderr) => {

        const runtime =
          Date.now() - startTime;

        fs.unlinkSync(tempPath);

        if (error) {
          return resolve({
            success: false,
            output:
              stderr || error.message,
            runtime,
            memory: "N/A",
          });
        }

        resolve({
          success: true,
          output: stdout.trim(),
          runtime,
          memory: "N/A",
        });
      }
    );
  });
}