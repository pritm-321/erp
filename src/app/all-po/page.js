"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function AllPOPage() {
  const [allPOs, setAllPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = localStorage.getItem("organizationId");
      setOrganizationId(orgs || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, [accessToken, organizationId]);

  useEffect(() => {
    async function fetchAllPOs() {
      setLoading(true);
      setErrorMsg("");
      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        };
        const res = await axios.get(`${API}so/po`, { headers });
        setAllPOs(res.data?.data || []);
      } catch (err) {
        setAllPOs([]);
        setErrorMsg("Failed to fetch all POs.");
      } finally {
        setLoading(false);
      }
    }
    if (accessToken && organizationId) {
      fetchAllPOs();
    }
  }, [accessToken, organizationId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-7 text-blue-950">
          All Purchase Orders
        </h1>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : errorMsg ? (
          <div className="text-red-600 mb-2">{errorMsg}</div>
        ) : allPOs.purchase_orders.length === 0 ? (
          <div className="text-gray-500">No purchase orders found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white">
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    PO Number
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Vendor
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Order Date
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    References
                  </th>
                </tr>
              </thead>
              <tbody>
                {allPOs.purchase_orders.map((po) => (
                  <tr
                    key={po.po_id}
                    className="border-b border-gray-100 hover:bg-blue-50 align-top"
                  >
                    <td className="px-4 py-2 font-semibold">{po.po_number}</td>
                    <td className="px-4 py-2">
                      {po.vendor?.vendor_name || po.vendor?.vendor_id || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {po.order_date
                        ? new Date(po.order_date).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                    <td className="px-4 py-2">{po.status || "-"}</td>
                    <td className="px-4 py-2">
                      {po.references && po.references.length > 0 ? (
                        <table className="min-w-full bg-white border border-blue-100 rounded mb-2">
                          <thead>
                            <tr className="bg-blue-50 text-xs">
                              <th className="px-2 py-1">Ref Number</th>
                              <th className="px-2 py-1">Design Name</th>
                              <th className="px-2 py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {po.references.map((ref, ri) => (
                              <tr
                                key={ri}
                                className="border-b border-blue-50 text-xs"
                              >
                                <td className="px-2 py-1">{ref.ref_number}</td>
                                <td className="px-2 py-1">{ref.design_name}</td>
                                <td className="px-2 py-1">{ref.ref_status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
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
