"use client";
import { supabase } from "../utils/supabaseClient";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import Image from "next/image";
import { Package, Store, ClipboardList } from "lucide-react";

export default function AuthGoogle() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      const userObj = data?.session?.user || null;
      setUser(userObj);
      if (userObj) {
        callApi(userObj);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const userObj = session?.user || null;
        setUser(userObj);
        if (userObj) {
          callApi(userObj);
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const callApi = async (userObj) => {
    try {
      // Get access token from supabase session
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const response = await axios.get(`${API}user/signup`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.data.role === "Not_Selected") {
        const response = await axios.post(
          `${API}user/select_role`,
          { role: "Employee" },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log(response);
      } else if (response.data.role === "Employee") {
        window.location.href = "/dashboard";
      }
      console.log("API call successful:", response.data);
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Decorative background icons */}
      <Package
        className="absolute top-10 left-10 text-blue-200 opacity-30"
        size={120}
      />
      <Store
        className="absolute bottom-20 -right-20 text-blue-200 opacity-20"
        size={160}
      />
      <Store
        className="absolute top-60 -left-72 text-blue-200 opacity-20"
        size={160}
      />
      <ClipboardList
        className="absolute bottom-60 -left-24 text-blue-300 opacity-20"
        size={100}
      />
      <ClipboardList
        className="absolute top-36 -right-36 text-blue-300 opacity-20"
        size={130}
      />
      <Package
        className="absolute bottom-10 -left-96 text-blue-300 opacity-10"
        size={180}
      />
      {user ? (
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center relative z-10">
          <p className="mb-4 text-lg text-foreground">
            Signed in as {user.email}
          </p>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-6 py-2 rounded-full shadow font-semibold hover:bg-red-600 transition"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center w-full relative z-10">
          <Image
            src={"/logo.png"}
            alt="Logo"
            width={1000}
            height={40}
            className="object-contain w-full mb-5 rounded-full "
          />
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Quiktrack
          </h1>
          <p className="mb-6 text-blue-700 text-center">
            Sign in with your Google account to continue.
          </p>
          <button
            onClick={signInWithGoogle}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full shadow-lg font-semibold text-lg hover:from-blue-600 hover:to-blue-800 transition"
          >
            <img src="/google.png" alt="Google" className="mr-3 w-7 h-7" /> Sign
            In with Google
          </button>
        </div>
      )}
    </div>
  );
}
