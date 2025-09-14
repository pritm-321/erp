"use client";
import axios from "axios";
import { useState } from "react";

export default function ChooseRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (role) => {
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/user/select_role", { role });
      // Redirect after successful selection
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Failed to select role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Choose your role</h1>
      <div className="flex gap-8">
        <button
          onClick={() => handleSelect("Organization")}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
          disabled={loading}
        >
          Organization
        </button>
        <button
          onClick={() => handleSelect("Employee")}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          disabled={loading}
        >
          Employee
        </button>
      </div>
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
