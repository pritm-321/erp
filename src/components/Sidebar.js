import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";
import { Store } from "lucide-react";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [openDeptIdx, setOpenDeptIdx] = useState(null);

  const fakeDepartments = Array.from({ length: 6 }, (_, i) => ({
    dept_name: `Department ${i + 1}`,
    subheadings: [
      { name: "Design", link: `/view-design` },
      { name: "View PO", link: `/view-po` },
      { name: "Reports", link: `/view-reports` },
    ],
  }));

  useEffect(() => {
    fetchDepartments();
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
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      let organizationId = "";
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const res = await axios.get(`${API}emp/departments/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      console.log(res.data);
      setDepartments(res.data?.departments || []);
    } catch (err) {
      setDepartments([]);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <aside className="w-68 h-screen bg-gradient-to-b from-purple-50 to-purple-200 flex flex-col items-center py-10 px-4 shadow-lg min-h-screen">
      <div className="mb-8 text-center w-full">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-400 to-purple-600 mx-auto mb-3 flex items-center justify-center text-3xl text-white font-bold shadow-lg border-4 border-white">
          {user?.email ? user.email[0].toUpperCase() : "U"}
        </div>
        <div className="font-semibold text-lg text-purple-900">
          {user?.email || "User"}
        </div>
        <div className="text-xs text-purple-600 mt-1">
          {user?.role ? user.role : "Employee"}
        </div>
      </div>
      <nav className="flex flex-col gap-4 w-full mb-8">
        <div className="mb-4">
          <span className=" text-purple-700 font-semibold mb-2 text-2xl flex items-center">
            <Store className="inline-block mr-2" size={25} />
            Departments
          </span>
          <div className="space-y-2 ml-2">
            {fakeDepartments.map((dept, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow border border-purple-100"
              >
                <button
                  className={`w-full text-left px-4 py-2 font-semibold text-purple-800 hover:bg-gray-100 rounded-lg transition flex justify-between items-center`}
                  onClick={() =>
                    setOpenDeptIdx(openDeptIdx === idx ? null : idx)
                  }
                >
                  {dept.dept_name}
                  <span className="ml-2 text-xs text-purple-500">
                    {openDeptIdx === idx ? "▲" : "▼"}
                  </span>
                </button>
                {openDeptIdx === idx && (
                  <div className="pl-6 pb-2 pt-1">
                    {dept.subheadings.map((sub, subIdx) => (
                      <a
                        key={subIdx}
                        href={sub.link}
                        className="py-1 text-purple-700 hover:underline cursor-pointer block"
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* <a
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-white hover:bg-purple-200 text-purple-700 font-medium transition shadow text-center"
        >
          Dashboard
        </a>
        <a
          href="/view-design"
          className="px-4 py-2 rounded-lg bg-white hover:bg-purple-200 text-purple-700 font-medium transition shadow text-center"
        >
          View Designs
        </a>
        <a
          href="/create-design"
          className="px-4 py-2 rounded-lg bg-white hover:bg-purple-200 text-purple-700 font-medium transition shadow text-center"
        >
          Create Design
        </a>
        <a
          href="/profile"
          className="px-4 py-2 rounded-lg bg-white hover:bg-purple-200 text-purple-700 font-medium transition shadow text-center"
        >
          View Profile
        </a> */}
      </nav>
      <button
        onClick={signOut}
        className="mt-auto w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow hover:from-red-600 hover:to-red-700 font-semibold transition"
      >
        Sign Out
      </button>
    </aside>
  );
}
