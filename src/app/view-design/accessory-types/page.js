"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye } from "lucide-react";

export default function AccessoryTypesPage() {
  const router = useRouter();
  // const queryGroupId = localStorage.getItem("group_id");
  const groupId =
    typeof window !== "undefined" && localStorage.getItem("group_id");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [types, setTypes] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrganizationId(localStorage.getItem("organizationId") || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        };
        const res = await axios.get(`${API}so/accessory-types/${groupId}`, {
          headers,
        });
        setTypes(res.data?.data || []);
      } catch (err) {
        setTypes([]);
        setError("Failed to fetch accessory types.");
      } finally {
        setLoading(false);
      }
    };
    if (accessToken && organizationId && groupId) fetchTypes();
  }, [accessToken, organizationId, groupId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-950">Accessory Types</h1>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : types.length === 0 ? (
          <div className="text-gray-500">No accessory types found.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-blue-200 bg-white">
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead className="bg-gray-50">
                <tr>
                  {/* <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Type ID
                  </th> */}
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Type Name
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    # Requirements
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Total Required Qty
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr
                    key={t.accessory_type_id}
                    className="border-b border-gray-100 hover:bg-blue-50"
                  >
                    {/* <td className="px-4 py-2">{t.accessory_type_id}</td> */}
                    <td className="px-4 py-2 font-semibold">
                      {t.accessory_type_name}
                    </td>
                    <td className="px-4 py-2">{t.num_requirements}</td>
                    <td className="px-4 py-2">{t.total_required_qty}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-2">
                        <button
                          className="bg-foreground text-white px-3 py-1 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                          onClick={() => {
                            router.push("/view-design/trims-requirements");
                            localStorage.setItem(
                              "accessory_type_id",
                              t.accessory_type_id
                            );
                          }}
                        >
                          <Eye size={20} />
                          Trims Requirements
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
