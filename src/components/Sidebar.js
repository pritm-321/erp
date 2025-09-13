import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Sidebar() {
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
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <aside className="w-68 h-screen bg-gradient-to-b from-blue-50 to-blue-200 flex flex-col items-center py-10 px-4 shadow-lg min-h-screen">
      <div className="mb-8 text-center w-full">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 mx-auto mb-3 flex items-center justify-center text-3xl text-white font-bold shadow-lg border-4 border-white">
          {user?.email ? user.email[0].toUpperCase() : "U"}
        </div>
        <div className="font-semibold text-lg text-blue-900">
          {user?.email || "User"}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          {user?.role ? user.role : "Employee"}
        </div>
      </div>
      <nav className="flex flex-col gap-4 w-full mb-8">
        <a
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-white hover:bg-blue-200 text-blue-700 font-medium transition shadow text-center"
        >
          Dashboard
        </a>
        <a
          href="/view-design"
          className="px-4 py-2 rounded-lg bg-white hover:bg-blue-200 text-blue-700 font-medium transition shadow text-center"
        >
          View Designs
        </a>
        <a
          href="/create-design"
          className="px-4 py-2 rounded-lg bg-white hover:bg-blue-200 text-blue-700 font-medium transition shadow text-center"
        >
          Create Design
        </a>
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
