"use client";
import { supabase } from "../utils/supabaseClient";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";

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
    <div>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="flex items-center px-4 py-2 bg-white text-black rounded-full  shadow cursor-pointer"
        >
          <img src="/google.png" alt="Google" className="mr-2" /> Sign In with
          Google
        </button>
      )}
    </div>
  );
}
