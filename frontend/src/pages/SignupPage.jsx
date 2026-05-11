import { useState } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

export default function SignupPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:4000/api/signup",

        {
          username,
          email,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);

      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  }

  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-slate-950
      text-white
    "
    >
      <form
        onSubmit={handleSignup}
        className="
          bg-slate-900
          p-8
          rounded-2xl
          w-[400px]
          border
          border-slate-700
        "
      >
        <h1
          className="
          text-3xl
          font-bold
          mb-6
        "
        >
          Signup
        </h1>

        {error && (
          <p
            className="
            text-red-400
            mb-4
          "
          >
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="
            w-full
            p-3
            rounded-xl
            bg-slate-800
            mb-4
          "
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="
            w-full
            p-3
            rounded-xl
            bg-slate-800
            mb-4
          "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full
            p-3
            rounded-xl
            bg-slate-800
            mb-6
          "
        />

        <button
          className="
            w-full
            py-3
            bg-green-600
            hover:bg-green-500
            rounded-xl
            font-bold
            transition
          "
        >
          Signup
        </button>
        <p
          className="
  text-slate-400
  text-center
  mt-4
"
        >
          Already have an account?
          <a
            href="/login"
            className="
      text-green-400
      ml-2
      hover:underline
    "
          >
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
