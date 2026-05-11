import { Link } from "react-router-dom";

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  function logout() {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href = "/login";
  }

  return (
    <div
      className="
      w-full
      bg-slate-900
      border-b
      border-slate-700
      px-8
      py-4
      flex
      justify-between
      items-center
    "
    >
      {/* LOGO */}
      <Link
        to="/problems"
        className="
          text-3xl
          font-bold
          text-white
        "
      >
        DSA Debug 
      </Link>

      {/* RIGHT SIDE */}
      <div
        className="
        flex
        items-center
        gap-6
        text-lg
      "
      >
        <Link
          to="/problems"
          className="
            text-slate-300
            hover:text-white
            transition
          "
        >
          Problems
        </Link>

        <Link
          to="/submissions"
          className="
            text-slate-300
            hover:text-white
            transition
          "
        >
          Submissions
        </Link>

        <Link
          to="/profile"
          className="
            text-slate-300
            hover:text-white
            transition
          "
        >
          Profile
        </Link>

        {user ? (
          <>
            <span
              className="
              text-slate-300
              font-semibold
            "
            >
              {user.username}
            </span>

            <button
              onClick={logout}
              className="
                px-4
                py-2
                bg-red-600
                hover:bg-red-500
                rounded-xl
                font-bold
                transition
              "
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="
                px-4
                py-2
                bg-blue-600
                hover:bg-blue-500
                rounded-xl
                font-bold
                transition
              "
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="
                px-4
                py-2
                bg-green-600
                hover:bg-green-500
                rounded-xl
                font-bold
                transition
              "
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
