"use client";
import Sidebar from "@/components/Sidebar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios, { all } from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";

export default function GroupDesignsPage() {
  const searchParams = useSearchParams();
  const groupId = decodeURIComponent(searchParams.get("groupId"));
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = JSON.parse(localStorage.getItem("organizations"));
      setOrganizationId(orgs?.data?.joined?.[0]?.organization_id || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, []);

  useEffect(() => {
    // const fetchDesigns = async () => {
    //   setLoading(true);
    //   setError("");
    //   try {
    //     // Fetch all designs and filter by groupId
    //     const res = await axios.get(
    //       `${API}design/merchant/${localStorage.getItem(
    //         "merchant_department_id"
    //       )}`,
    //       {
    //         headers: {
    //           Authorization: `Bearer ${accessToken}`,
    //           "Organization-ID": organizationId,
    //         },
    //       }
    //     );

    //     // Group logic: filter designs by groupId
    //     const allDesigns = res.data?.data?.designs || [];

    //     const grouped = {};
    //     allDesigns.forEach((d) => {
    //       const key = [
    //         d.party,
    //         d.order_quantity,
    //         d.design_type,
    //         d.mrp,
    //         d.rate,
    //         d.delivery_date,
    //       ].join("|");
    //       if (!grouped[key]) grouped[key] = [];
    //       grouped[key].push(d);
    //     });
    //     const groupedEntries = Object.entries(grouped);
    //     console.log(groupedEntries, " grouped designs");
    //     setDesigns(groupedEntries);
    //   } catch (err) {
    //     setError("Failed to fetch designs.");
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    if (accessToken && organizationId && groupId) {
      // fetchDesigns();
      // Fetch designs from localStorage for this group
      if (typeof window !== "undefined") {
        const allDesigns = JSON.parse(
          localStorage.getItem("selected_group_designs") || "[]"
        );
        setDesigns(allDesigns);
        setLoading(false);
      }
    }
  }, [accessToken, organizationId, groupId]);

  // Extract common group fields from first design
  const groupInfo =
    designs.length > 0
      ? {
          party: designs[0].party,
          order_quantity: designs[0].order_quantity,
          design_type: designs[0].design_type,
          mrp: designs[0].mrp,
          rate: designs[0].rate,
          delivery_date: designs[0].delivery_date,
        }
      : {};

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <h1 className="text-3xl font-bold mb-6 text-purple-900">
          Designs in Group
        </h1>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : designs.length === 0 ? (
          <div className="p-4 text-gray-500">
            No designs found in this group.
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-semibold text-purple-800">Party:</span>{" "}
                  <span className="font-bold">{groupInfo.party}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">
                    Order Quantity:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.order_quantity}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">
                    Design Type:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.design_type}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">MRP:</span>{" "}
                  <span className="font-bold">{groupInfo.mrp}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">Rate:</span>{" "}
                  <span className="font-bold">{groupInfo.rate}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">
                    Delivery Date:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.delivery_date}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border-gray-100 rounded-xl shadow">
                <thead className="bg-gradient-to-r from-purple-100 to-purple-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Image
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Design Name
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      PO
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {designs.map((d) => (
                    <tr
                      key={d.design_id}
                      className="border-b border-gray-100 hover:bg-purple-50"
                    >
                      <td className="px-4 py-2">
                        <img
                          src={d.image_url || "/default-design.png"}
                          alt={d.design_name}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-purple-200"
                        />
                      </td>
                      <td className="px-4 py-2 font-semibold text-purple-900">
                        {d.design_name}
                      </td>
                      <td className="px-4 py-2 text-purple-700">{d.status}</td>
                      <td className="px-4 py-2 text-purple-700">{d.po}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button className="bg-green-500 text-white px-3 py-1 rounded shadow hover:bg-green-600 transition text-sm">
                            Upload Parts
                          </button>
                          <button className="bg-purple-500 text-white px-3 py-1 rounded shadow hover:bg-purple-600 transition text-sm">
                            View Parts
                          </button>
                          <button className="bg-purple-600 text-white px-3 py-1 rounded shadow hover:bg-purple-700 transition text-sm">
                            View Fabric Requirements
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
