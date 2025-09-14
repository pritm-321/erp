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
  const [showJoinModal, setShowJoinModal] = useState(false);

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
    <section className="mb-8 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-900">
          Joined Organizations
        </h2>
        <button
          onClick={() => setShowJoinModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-5 py-2 rounded-xl shadow hover:from-purple-700 hover:to-purple-600 font-semibold transition"
        >
          + Join Organization
        </button>
      </div>
      {organizations &&
      organizations.data &&
      organizations.data.joined &&
      organizations.data.joined.length > 0 ? (
        <div className="max-w-7xl grid grid-cols-4 gap-6">
          {organizations.data.joined.map((org, idx) => (
            <button
              key={idx}
              className="flex items-center gap-4 bg-white border border-purple-200 rounded-xl p-5 shadow-md hover:shadow-lg transition w-full text-left cursor-pointer"
              onClick={() => (window.location.href = `/view-design`)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-400 to-purple-600 flex items-center justify-center text-xl text-white font-bold shadow border-2 border-purple-100">
                {org.organization_name
                  ? org.organization_name[0].toUpperCase()
                  : "O"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-purple-900 text-lg">
                  {org.organization_name}
                </div>
                {/* <div className="text-sm text-purple-700">
                  ID: {org.organization_id}
                </div> */}
                <div className="text-xs text-gray-500 mt-1">
                  Joined: {org.joined_at}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No organizations joined yet.</div>
      )}
      {/* Join Organization Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-purple-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-purple-700 text-2xl font-bold"
              onClick={() => setShowJoinModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-6 text-purple-900 text-center">
              Join Organization
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
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
                  setJoinResult(res.data.message || "Joined successfully!");
                  setShowJoinModal(false);
                  setJoinCode("");
                  // Optionally, refresh organizations
                  fetchOrganizations();
                } catch (err) {
                  setError("Failed to join organization.");
                }
              }}
              className="flex flex-col gap-5"
            >
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter join code"
                className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg shadow hover:from-purple-700 hover:to-purple-600 font-semibold transition"
              >
                Join
              </button>
              {joinResult && (
                <p className="text-green-600 text-sm text-center">
                  {joinResult}
                </p>
              )}
              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
