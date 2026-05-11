import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

import { fetchSubmissions } from "../services/api";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await fetchSubmissions();

      setSubmissions(data);
    }

    load();
  }, []);

  return (
    <div
      className="
      min-h-screen
      bg-slate-950
      text-white
    "
    >
      <Navbar />

      <div className="p-8">
        <h1
          className="
          text-4xl
          font-bold
          mb-8
        "
        >
          Submission History
        </h1>

        <div
          className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
        "
        >
          <table
            className="
            w-full
            text-left
          "
          >
            <thead
              className="
              bg-slate-900
            "
            >
              <tr>
                <th className="p-4">Problem</th>

                <th className="p-4">Language</th>

                <th className="p-4">Status</th>

                <th className="p-4">Date</th>

                <th className="p-4">View</th>
              </tr>
            </thead>

            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission._id}
                  className="
                    border-t
                    border-slate-700
                    hover:bg-slate-900
                  "
                >
                  <td className="p-4">{submission.problemTitle}</td>

                  <td className="p-4">{submission.language}</td>

                  <td className="p-4">
                    <span
                      className={`
                      px-3
                      py-1
                      rounded-full
                      text-sm
                      font-bold
                      ${
                        submission.status === "Accepted"
                          ? "bg-green-600"
                          : "bg-red-600"
                      }
                    `}
                    >
                      {submission.status}
                    </span>
                  </td>

                  <td className="p-4">
                    {new Date(submission.createdAt).toLocaleString()}
                  </td>

                  <td className="p-4">
                    <Link
                      to={`/submission/${submission._id}`}
                      className="
                        text-blue-400
                        hover:underline
                      "
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
