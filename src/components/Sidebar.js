import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";
import { LogOut, Store, User } from "lucide-react";
import Image from "next/image";

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
      console.log(data);

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
      const res = await axios.get(`${API}emp/manage/departments`, {
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
    <aside className="w-68 h-screen border-r border-gray-300 bg-gray-50 flex flex-col items-center py-10 px-4 shadow-lg min-h-screen">
      <div className="mb-8 text-center w-full">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-400 to-purple-600 p-1 mx-auto mb-3 flex items-center justify-center text-3xl text-white font-bold shadow-lg  border-white">
          <Image
            src={user?.identities[0]?.identity_data.avatar_url || "/logo.png"}
            alt="Logo"
            width={40}
            height={40}
            className="object-contain w-full h-full rounded-full "
          />
        </div>
        <div className="font-semibold text-lg text-purple-900">
          {user?.identities[0]?.identity_data.name || "User"}
        </div>
        {/* <div className="text-xs text-purple-600 mt-1">
          {user?.role ? user.role : "Employee"}
        </div> */}
      </div>
      <nav className="flex flex-col gap-4 w-full mb-8">
        <div className="mb-4">
          <span className=" text-purple-900 font-semibold mb-2 text-2xl flex items-center">
            <Store className="inline-block mr-2" size={25} />
            Departments
          </span>
          <div className="space-y-2 ml-2">
            {fakeDepartments.map((dept, idx) => (
              <div key={idx} className=" rounded-lg ">
                <button
                  className={`w-full text-left px-4 py-2 font-semibold text-purple-800 bg-purple-100 rounded-lg transition flex justify-between items-center`}
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
                  <div className="pl-6 pb-2 pt-1 bg-purple-50">
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
         */}
      </nav>
      <div className="mt-auto w-full">
        <a
          href="/profile"
          className="w-full flex px-4 py-2 rounded-lg bg-white hover:bg-purple-200 text-purple-700 font-medium transition shadow text-center mb-5"
        >
          <User className="mr-2" />
          View Profile
        </a>
        <button
          onClick={signOut}
          className=" w-full flex bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow hover:from-red-600 hover:to-red-700 font-semibold transition"
        >
          <LogOut className="mr-2" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
