import axios from "axios";
const API = "http://localhost:4000";

export async function fetchProblems() {
  const response = await fetch(`${API}/api/problems`);

  return response.json();
}

export async function fetchProblem(slug) {
  const response = await fetch(`${API}/api/problems/${slug}`);

  return response.json();
}

export async function runCodeAPI(body) {
  const response = await fetch(`${API}/api/run`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });

  return response.json();
}

export async function submitCode(data) {
  const response = await axios.post(
    "http://localhost:4000/api/submit",

    data,

    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  return response.data;
}

export async function submitCodeAPI(payload) {
  const res = await axios.post(
    "http://localhost:4000/api/submit",

    payload,

    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  return res.data;
}
export async function fetchProfile() {
  const res = await axios.get(
    "http://localhost:4000/api/profile",

    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  return res.data;
}

export async function fetchSubmissions() {
  const response = await fetch(`${API}/api/submissions`);

  return response.json();
}

export async function fetchSubmission(id) {
  const response = await fetch(`${API}/api/submissions/${id}`);

  return response.json();
}

export async function fetchProfileStats() {
  const response = await fetch(`${API}/api/profile/stats`);

  return response.json();
}
