import { useEffect, useState } from "react";

export default function ProblemList({ onSelect }) {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/problems")
      .then((res) => res.json())
      .then(setProblems);
  }, []);

  return (
    <div className="space-y-3">
      {problems.map((problem) => (
        <div
          key={problem.id}
          onClick={() => onSelect(problem)}
          className="
            p-4
            bg-slate-800
            rounded-xl
            cursor-pointer
            hover:bg-slate-700
            transition
          "
        >
          <h2 className="font-bold text-lg">{problem.title}</h2>

          <p className="text-sm text-slate-400">{problem.difficulty}</p>
        </div>
      ))}
    </div>
  );
}
