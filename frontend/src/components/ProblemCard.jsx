import { Link } from "react-router-dom";

export default function ProblemCard({ problem }) {
  const difficultyColors = {
    Easy: "bg-green-600",

    Medium: "bg-yellow-600",

    Hard: "bg-red-600",
  };

  return (
    <Link to={`/problems/${problem.slug}`}>
      <div
        className="
        p-5
        bg-slate-800
        rounded-2xl
        border
        border-slate-700
        hover:border-blue-500
        transition
        cursor-pointer
      "
      >
        <div
          className="
          flex
          justify-between
          items-center
        "
        >
          <h2
            className="
            text-xl
            font-bold
            text-white
          "
          >
            {problem.title}
          </h2>

          <span
            className={`
            px-3
            py-1
            rounded-full
            text-sm
            font-bold
            text-white
            ${difficultyColors[problem.difficulty]}
          `}
          >
            {problem.difficulty}
          </span>
        </div>

        <div
          className="
          mt-4
          flex
          flex-wrap
          gap-2
        "
        >
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="
                px-2
                py-1
                bg-slate-700
                rounded-lg
                text-sm
              "
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
