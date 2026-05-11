import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import ProblemCard from "../components/ProblemCard";

import { fetchProblems } from "../services/api";

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);

  const [search, setSearch] = useState("");

  const [difficulty, setDifficulty] = useState("All");

  useEffect(() => {
    async function loadProblems() {
      const data = await fetchProblems();

      setProblems(data);
    }

    loadProblems();
  }, []);

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title
      .toLowerCase()

      .includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "All" || problem.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;
  });

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
          Problems
        </h1>

        <div
          className="
  flex
  flex-col
  md:flex-row
  gap-4
  mb-8
"
        >
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
      flex-1
      px-4
      py-3
      rounded-xl
      bg-slate-800
      border
      border-slate-700
      outline-none
    "
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="
      px-4
      py-3
      rounded-xl
      bg-slate-800
      border
      border-slate-700
    "
          >
            <option value="All">All</option>

            <option value="Easy">Easy</option>

            <option value="Medium">Medium</option>

            <option value="Hard">Hard</option>
          </select>
        </div>

        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-6
        "
        >
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      </div>
    </div>
  );
}
