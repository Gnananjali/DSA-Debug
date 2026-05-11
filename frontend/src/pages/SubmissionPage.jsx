import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

import { fetchSubmission } from "../services/api";

export default function SubmissionPage() {
  const { id } = useParams();

  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchSubmission(id);

      setSubmission(data);
    }

    load();
  }, [id]);

  if (!submission) {
    return (
      <div
        className="
        min-h-screen
        bg-slate-950
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

      <div
        className="
        p-8
        max-w-6xl
        mx-auto
      "
      >
        <div
          className="
          flex
          justify-between
          items-center
          mb-8
        "
        >
          <div>
            <h1
              className="
              text-4xl
              font-bold
            "
            >
              {submission.problemTitle}
            </h1>

            <p
              className="
              text-slate-400
              mt-2
            "
            >
              {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>

          <div
            className={`
            px-4
            py-2
            rounded-full
            font-bold
            ${submission.status === "Accepted" ? "bg-green-600" : "bg-red-600"}
          `}
          >
            {submission.status}
          </div>
        </div>

        {/* PERFORMANCE */}
        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
          mb-8
        "
        >
          <div
            className="
            p-5
            bg-slate-900
            rounded-2xl
            border
            border-slate-700
          "
          >
            <h2
              className="
              text-xl
              font-bold
              mb-3
            "
            >
              Runtime
            </h2>

            <p
              className="
              text-3xl
              font-bold
              text-green-400
            "
            >
              {submission.runtime || 0} ms
            </p>
          </div>

          <div
            className="
            p-5
            bg-slate-900
            rounded-2xl
            border
            border-slate-700
          "
          >
            <h2
              className="
              text-xl
              font-bold
              mb-3
            "
            >
              Memory
            </h2>

            <p
              className="
              text-3xl
              font-bold
              text-blue-400
            "
            >
              {submission.memory || 0} MB
            </p>
          </div>
        </div>

        {/* CODE */}
        <div
          className="
          mb-8
          p-5
          bg-slate-900
          rounded-2xl
          border
          border-slate-700
        "
        >
          <h2
            className="
            text-2xl
            font-bold
            mb-4
          "
          >
            Submitted Code
          </h2>

          <pre
            className="
            overflow-x-auto
            text-sm
            text-green-400
            whitespace-pre-wrap
          "
          >
            {submission.code}
          </pre>
        </div>

        {/* TEST RESULTS */}
        <div
          className="
          p-5
          bg-slate-900
          rounded-2xl
          border
          border-slate-700
        "
        >
          <h2
            className="
            text-2xl
            font-bold
            mb-4
          "
          >
            Test Results
          </h2>

          <div
            className="
            space-y-3
          "
          >
            {submission.results.map((test) => (
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

                  <span>{test.passed ? "✅ Passed" : "❌ Failed"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
