"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  const [joinCode, setJoinCode] = useState("");
  const [joinResult, setJoinResult] = useState("");
  const [permissions, setPermissions] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organizations, setOrganizations] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    fetchOrganizations();
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    console.log(joinCode);

    setError("");
    setJoinResult("");
    try {
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const res = await axios.post(
        `${API}emp/join_request`,
        {
          join_code: joinCode,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log(res);
      setJoinResult(res.data.message || "Joined successfully!");
    } catch (err) {
      setError("Failed to join organization.");
    }
  };

  const fetchOrganizations = async () => {
    setError("");
    try {
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const res = await axios.get(`${API}emp/fetch_joined_organizations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setOrganizations(res.data);
      if (typeof window !== "undefined") {
        localStorage.setItem("organizations", JSON.stringify(res.data));
      }
    } catch (err) {
      setError("Failed to fetch joined organizations.");
    }
  };

  const fetchPermissions = async () => {
    setError("");
    console.log(organizations.data.joined[0]?.organization_id);

    try {
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const res = await axios.get(`${API}emp/get_permissions`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Organization-ID":
            organizations.data.joined[0]?.organization_id || "", // Replace with actual organization ID if needed
        },
      });
      console.log(res);

      setPermissions(res.data);
    } catch (err) {
      setError("Failed to fetch permissions.");
    }
  };

  const fetchProfile = async () => {
    setError("");
    try {
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const res = await axios.get(`${API}emp/fetch_employee_details_by_id`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Organization-ID":
            organizations.data.joined[0]?.organization_id || "", // Replace with actual organization ID if needed
        },
      });
      console.log(res);

      setProfile(res.data);
    } catch (err) {
      setError("Failed to fetch profile info.");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        {/* Join Organization Section */}
        <section className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Join Organization</h2>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter join code"
              className="border px-2 py-1 rounded"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded"
            >
              Join
            </button>
          </form>
          {joinResult && <p className="mt-2 text-green-600">{joinResult}</p>}
        </section>

        {/* Fetch Joined Organizations Section */}
        <section className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Joined Organizations</h2>
          {organizations && (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(organizations, null, 2)}
            </pre>
          )}
        </section>

        {/* Fetch Permissions Section */}
        <section className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Employee Permissions</h2>
          <button
            onClick={fetchPermissions}
            className="bg-gray-700 text-white px-4 py-1 rounded mb-2"
          >
            Fetch Permissions
          </button>
          {permissions && (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(permissions, null, 2)}
            </pre>
          )}
        </section>

        {/* Fetch Profile Section */}
        <section className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Profile Info</h2>
          <button
            onClick={fetchProfile}
            className="bg-gray-700 text-white px-4 py-1 rounded mb-2"
          >
            Fetch Profile
          </button>
          {profile && (
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          )}
        </section>

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </main>
    </div>
  );
}
