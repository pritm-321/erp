"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";
import Sidebar from "@/components/Sidebar";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        let organizationId = "";
        if (typeof window !== "undefined") {
          const orgs = JSON.parse(localStorage.getItem("organizations"));
          organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
        }
        const accessToken = await supabase.auth
          .getSession()
          .then(({ data }) => data?.session?.access_token);
        const res = await axios.get(`${API}emp/fetch_employee_details_by_id`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Organization-ID": organizationId,
          },
        });
        setProfile(res.data.data);
      } catch (err) {
        setError("Failed to fetch profile info.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-8 text-purple-900">
          Profile Info
        </h1>
        {loading ? (
          <div className="text-center text-purple-600">Loading profile...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : profile ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-purple-600 flex items-center justify-center text-3xl text-white font-bold shadow-lg border-4 border-white">
                {profile.name ? profile.name[0].toUpperCase() : "U"}
              </div>
              <div>
                <div className="text-xl font-semibold text-purple-900">
                  {profile.name}
                </div>
                <div className="text-sm text-purple-600">
                  {profile.role} @ {profile.organization}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Employee ID: {profile.employee_id}
                </div>
                <div className="text-xs text-gray-500">
                  Joined: {profile.joined_at}
                </div>
              </div>
            </div>
            <h2 className="text-lg font-bold text-purple-800 mb-2">
              Departments
            </h2>
            <div className="grid gap-4">
              {profile.department.map((dept, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-purple-50">
                  <div className="font-semibold text-purple-900">
                    {dept.dept_name}
                  </div>
                  <div className="text-sm text-purple-700">
                    {dept.description}
                  </div>
                  <div className="text-xs text-purple-500 mt-1">
                    Type: {dept.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
