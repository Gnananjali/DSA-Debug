import Split from "react-split";

import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import Editor from "@monaco-editor/react";

import Navbar from "../components/Navbar";

import { fetchProblem, runCodeAPI, submitCodeAPI } from "../services/api";

export default function ProblemWorkspace() {
  const { slug } = useParams();

  const [problem, setProblem] = useState(null);

  const [language, setLanguage] = useState("javascript");

  const [code, setCode] = useState("");

  const [results, setResults] = useState([]);

  const [runtime, setRuntime] = useState(null);

  const [memory, setMemory] = useState(null);

  const [loading, setLoading] = useState(false);

  const [aiExplanation, setAiExplanation] = useState("");

  const [activeTab, setActiveTab] = useState("results");

  useEffect(() => {
    async function loadProblem() {
      const data = await fetchProblem(slug);

      setProblem(data);

      setCode(data.starter.javascript);
    }

    loadProblem();
  }, [slug]);

  async function runCode() {
    setResults([]);

    setLoading(true);

    const data = await runCodeAPI({
      code,

      language,

      problemId: problem.id,

      problemTitle: problem.title,
    });

    setResults(data.results || []);

    setLoading(false);
  }

  async function submitCode() {
    setResults([]);

    setLoading(true);

    const data = await submitCodeAPI({
      code,

      language,

      problemId: problem.id,

      problemTitle: problem.title,
    });

    setResults(data.results || []);

    setRuntime(data.runtime);

    setMemory(data.memory);

    setAiExplanation(data.aiExplanation || "");

    setLoading(false);
  }

  if (!problem) {
    return (
      <div
        className="
      text-white
      p-10
    "
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className="
    min-h-screen
    bg-slate-950
    text-white
  "
    >
      <Navbar />

      <div className="p-4">
        <Split
          className="
          flex
          gap-4
          h-[90vh]
        "
          sizes={[45, 55]}
          minSize={300}
          gutterSize={10}
        >
          {/* LEFT SIDE */}
          <div
            className="
          bg-slate-900
          rounded-2xl
          p-6
          border
          border-slate-700
          overflow-y-auto
          h-[90vh]
        "
          >
            <h1
              className="
            text-3xl
            font-bold
            mb-4
          "
            >
              {problem.title}
            </h1>

            <div
              className="
            inline-block
            px-3
            py-1
            rounded-full
            bg-purple-600
            text-sm
            font-bold
            mb-4
          "
            >
              {problem.difficulty}
            </div>

            <div
              className="
            flex
            flex-wrap
            gap-2
            mt-4
            mb-6
          "
            >
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="
                  px-3
                  py-1
                  bg-slate-700
                  rounded-full
                  text-sm
                "
                >
                  {tag}
                </span>
              ))}
            </div>

            <p
              className="
            text-slate-300
            leading-relaxed
          "
            >
              {problem.description}
            </p>

            <h2
              className="
  text-xl
  font-bold
  mt-8
  mb-4
"
            >
              Examples
            </h2>

            <div className="space-y-4">
              {problem.examples.map((example, index) => (
                <div
                  key={index}
                  className="
        p-4
        bg-slate-800
        rounded-xl
      "
                >
                  <p>
                    <strong>Input:</strong> {example.input}
                  </p>

                  <p className="mt-2">
                    <strong>Output:</strong> {example.output}
                  </p>
                </div>
              ))}
            </div>

            <h2
              className="
  text-xl
  font-bold
  mt-8
  mb-4
"
            >
              Constraints
            </h2>

            <div
              className="
  p-4
  bg-slate-800
  rounded-xl
"
            >
              <ul
                className="
    list-disc
    ml-6
    space-y-2
  "
              >
                {problem.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <Split
            direction="vertical"
            className="
            flex
            flex-col
            h-[90vh]
            w-full
          "
            sizes={[65, 35]}
            minSize={120}
            gutterSize={10}
          >
            {/* TOP PANEL */}
            <div
              className="
            bg-slate-900
            rounded-2xl
            border
            border-slate-700
            p-4
            h-full
          "
            >
              {/* TOP BAR */}
              <div
                className="
              flex
              justify-between
              items-center
              mb-4
            "
              >
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="
                  bg-slate-800
                  px-4
                  py-2
                  rounded-xl
                "
                >
                  <option value="javascript">JavaScript</option>

                  <option value="python">Python</option>
                </select>

                <div
                  className="
                flex
                gap-3
              "
                >
                  <button
                    onClick={runCode}
                    className="
  px-5
  py-2
  bg-blue-600
  hover:bg-blue-500
  active:scale-95
  transition
  duration-200
  rounded-xl
  font-bold
  shadow-lg
  hover:shadow-blue-500/40
"
                  >
                    Run
                  </button>

                  <button
                    onClick={submitCode}
                    className="
  px-5
  py-2
  bg-green-600
  hover:bg-green-500
  active:scale-95
  transition
  duration-200
  rounded-xl
  font-bold
  shadow-lg
  hover:shadow-green-500/40
"
                  >
                    Submit
                  </button>
                </div>
              </div>

              <Editor
                height="85%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
              />
            </div>

            {/* BOTTOM PANEL */}
            <div
              className="
            bg-slate-900
            rounded-2xl
            border
            border-slate-700
            overflow-hidden
            h-full
          "
            >
              {/* TAB HEADER */}
              <div
                className="
              flex
              border-b
              border-slate-700
            "
              >
                <button
                  onClick={() => setActiveTab("results")}
                  className={`
                  px-6
                  py-4
                  font-bold
                  ${
                    activeTab === "results"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400"
                  }
                `}
                >
                  Test Results
                </button>

                <button
                  onClick={() => setActiveTab("performance")}
                  className={`
                  px-6
                  py-4
                  font-bold
                  ${
                    activeTab === "performance"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400"
                  }
                `}
                >
                  Performance
                </button>

                <button
                  onClick={() => setActiveTab("ai")}
                  className={`
                  px-6
                  py-4
                  font-bold
                  ${
                    activeTab === "ai"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400"
                  }
                `}
                >
                  AI Explanation
                </button>
              </div>

              {/* TAB CONTENT */}
              <div
                className="
              p-5
              overflow-y-auto
              h-[calc(100%-60px)]
            "
              >
                {activeTab === "results" &&
                  (results.length === 0 ? (
                    <p
                      className="
                    text-slate-400
                  "
                    >
                      Run or submit code to see results.
                    </p>
                  ) : (
                    <div
                      className="
                    space-y-3
                  "
                    >
                      {results.map((test) => (
                        <div
                          key={test.id}
                          className={`
                          p-4
                          rounded-xl
                          ${test.passed ? "bg-green-900" : "bg-red-900"}
                        `}
                        >
                          <div
                            className="
                          flex
                          justify-between
                        "
                          >
                            <span>
                              {test.hidden
                                ? `Hidden Test #${test.id}`
                                : `Test #${test.id}`}
                            </span>

                            <span>
                              {test.passed ? "✅ Passed" : "❌ Failed"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                {activeTab === "performance" &&
                  (runtime != null ? (
                    <div
                      className="
                    grid
                    grid-cols-2
                    gap-4
                  "
                    >
                      <div
                        className="
                      p-5
                      bg-slate-800
                      rounded-xl
                    "
                      >
                        <h3
                          className="
                        text-lg
                        font-bold
                        mb-3
                      "
                        >
                          Runtime
                        </h3>

                        <p
                          className="
                        text-3xl
                        text-green-400
                        font-bold
                      "
                        >
                          {runtime} ms
                        </p>
                      </div>

                      <div
                        className="
                      p-5
                      bg-slate-800
                      rounded-xl
                    "
                      >
                        <h3
                          className="
                        text-lg
                        font-bold
                        mb-3
                      "
                        >
                          Memory
                        </h3>

                        <p
                          className="
                        text-3xl
                        text-blue-400
                        font-bold
                      "
                        >
                          {memory} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="
                    text-slate-400
                  "
                    >
                      Submit code to view performance.
                    </p>
                  ))}

                {activeTab === "ai" && (
                  <pre
                    className="
                  whitespace-pre-wrap
                  text-slate-300
                "
                  >
                    {aiExplanation || "Submit code to view AI analysis."}
                  </pre>
                )}
              </div>
            </div>
          </Split>
        </Split>
      </div>
    </div>
  );
}
