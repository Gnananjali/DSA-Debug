import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import { fetchProfileStats } from "../services/api";

export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchProfileStats();

      setStats(data);
    }

    load();
  }, []);

  if (!stats) {
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
        max-w-6xl
        mx-auto
        p-8
      "
      >
        <div
          className="
          flex
          items-center
          gap-6
          mb-10
        "
        >
          <div
            className="
            w-24
            h-24
            rounded-full
            bg-blue-600
            flex
            items-center
            justify-center
            text-4xl
            font-bold
          "
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1
              className="
              text-4xl
              font-bold
            "
            >
              {user?.username}
            </h1>

            <p
              className="
              text-slate-400
              mt-2
            "
            >
              Coding Platform Explorer
            </p>
          </div>
        </div>

        {/* STATS */}
        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-4
          gap-4
          mb-10
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
              text-lg
              text-slate-400
            "
            >
              Solved Problems
            </h2>

            <p
              className="
              text-4xl
              font-bold
              mt-3
              text-green-400
            "
            >
              {stats.solvedProblems}
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
              text-lg
              text-slate-400
            "
            >
              Total Submissions
            </h2>

            <p
              className="
              text-4xl
              font-bold
              mt-3
              text-blue-400
            "
            >
              {stats.totalSubmissions}
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
              text-lg
              text-slate-400
            "
            >
              Accepted
            </h2>

            <p
              className="
              text-4xl
              font-bold
              mt-3
              text-green-400
            "
            >
              {stats.accepted}
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
              text-lg
              text-slate-400
            "
            >
              Failed
            </h2>

            <p
              className="
              text-4xl
              font-bold
              mt-3
              text-red-400
            "
            >
              {stats.failed}
            </p>
          </div>
        </div>

        <div
          className="
  bg-slate-900
  border
  border-slate-700
  rounded-2xl
  p-6
"
        >
          <h3
            className="
    text-slate-400
    mb-3
  "
          >
            Acceptance Rate
          </h3>

          <p
            className="
    text-4xl
    font-bold
    text-yellow-400
  "
          >
            {stats.totalSubmissions > 0
              ? Math.round((stats.accepted / stats.totalSubmissions) * 100)
              : 0}
            %
          </p>
        </div>

        {/* LANGUAGE STATS */}
        <div
          className="
          p-6
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
            mb-6
          "
          >
            Language Usage
          </h2>

          <div
            className="
            space-y-4
          "
          >
            {Object.entries(stats.languages).map(([lang, count]) => (
              <div key={lang}>
                <div
                  className="
                  flex
                  justify-between
                  mb-2
                "
                >
                  <span
                    className="
                    capitalize
                    font-medium
                  "
                  >
                    {lang}
                  </span>

                  <span>{count}</span>
                </div>

                <div
                  className="
                  w-full
                  h-3
                  bg-slate-700
                  rounded-full
                  overflow-hidden
                "
                >
                  <div
                    className="
                      h-full
                      bg-blue-500
                    "
                    style={{
                      width: `${count * 20}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
