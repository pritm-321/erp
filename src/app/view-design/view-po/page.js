"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";

export default function ViewPOPage() {
  // All POs state
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  // PO detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [poDetail, setPoDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const handleOpenPoDetail = async (poId) => {
    setDetailModalOpen(true);
    setPoDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API}so/po/${poId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      const detail = res?.data?.purchase_order || res?.data || {};
      setPoDetail(detail);
    } catch (e) {
      setDetailError("Failed to fetch PO details.");
    } finally {
      setDetailLoading(false);
    }
  };

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
    const fetchPOs = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API}so/pos`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        const list =
          res?.data?.purchase_orders ||
          res?.data?.data?.purchase_orders ||
          res?.data ||
          [];
        setPos(Array.isArray(list) ? list : []);
      } catch (err) {
        setError("Failed to fetch POs.");
      } finally {
        setLoading(false);
      }
    };
    if (accessToken && organizationId) fetchPOs();
  }, [accessToken, organizationId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <h1 className="text-3xl font-bold mb-6 text-purple-950">
          Purchase Orders
        </h1>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : pos.length === 0 ? (
          <div className="p-4 text-gray-500">No POs found.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-purple-200">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    PO Number
                  </th>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    PO ID
                  </th>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    Vendor Name
                  </th>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    Design Name
                  </th>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    Order Date
                  </th>
                  <th className="px-4 py-2 text-left text-purple-950 font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po, idx) => (
                  <tr
                    key={po.po_id || idx}
                    className="border-b border-gray-100 hover:bg-purple-50"
                  >
                    <td className="px-4 py-2 text-purple-900 font-semibold">
                      {po.po_number || po.po_id || "-"}
                    </td>
                    <td className="px-4 py-2 text-purple-900">
                      {po.po_id ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-purple-900">
                      {po.vendor?.vendor_name || po.vendor_name || "-"}
                    </td>
                    <td className="px-4 py-2 text-purple-900">
                      {po.design?.design_name || po.design_name || "-"}
                    </td>
                    <td className="px-4 py-2 text-purple-700">
                      {po.status || "-"}
                    </td>
                    <td className="px-4 py-2 text-purple-700">
                      {po.order_date
                        ? new Date(po.order_date).toLocaleString()
                        : po.created_at || po.date || "-"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="px-3 py-1 bg-purple-600 text-white rounded shadow hover:bg-purple-700 text-sm"
                        onClick={() => handleOpenPoDetail(po.po_id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {detailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setDetailModalOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-purple-900">
                PO Details
              </h2>
              {detailLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : detailError ? (
                <div className="text-red-600">{detailError}</div>
              ) : !poDetail ? (
                <div className="text-gray-500">No details available.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                    <div className="text-purple-900">
                      <span className="font-semibold">PO Number:</span>{" "}
                      {poDetail.po_number || "-"}
                    </div>
                    <div className="text-purple-900">
                      <span className="font-semibold">PO ID:</span>{" "}
                      {poDetail.po_id || "-"}
                    </div>
                    <div className="text-purple-900">
                      <span className="font-semibold">Status:</span>{" "}
                      {poDetail.status || "-"}
                    </div>
                    <div className="text-purple-900">
                      <span className="font-semibold">Vendor:</span>{" "}
                      {poDetail.vendor?.name || poDetail.vendor_name || "-"}
                    </div>
                    <div className="text-purple-900">
                      <span className="font-semibold">Design:</span>{" "}
                      {poDetail.design?.name || poDetail.design_name || "-"}
                    </div>
                    <div className="text-purple-900">
                      <span className="font-semibold">Design Quantity:</span>{" "}
                      {poDetail.design?.quantity || poDetail.design_name || "-"}
                    </div>
                    <div className="text-purple-900">
                      <span className="font-semibold">Order Date:</span>{" "}
                      {poDetail.order_date
                        ? new Date(poDetail.order_date).toLocaleString()
                        : poDetail.created_at || poDetail.date || "-"}
                    </div>
                  </div>
                  {(() => {
                    const lines =
                      poDetail.items ||
                      poDetail.lines ||
                      poDetail.po_items ||
                      [];
                    return Array.isArray(lines) && lines.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">
                          Line Items
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-purple-200">
                          <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-purple-950 font-bold">
                                  Fabric Name
                                </th>
                                <th className="px-4 py-2 text-left text-purple-950 font-bold">
                                  Qty
                                </th>
                                <th className="px-4 py-2 text-left text-purple-950 font-bold">
                                  Color Name
                                </th>
                                {/* <th className="px-4 py-2 text-left text-purple-950 font-bold">
                                  Amount
                                </th> */}
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((li, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-gray-100"
                                >
                                  <td className="px-4 py-2 text-purple-900">
                                    {li.fabric_type_name ||
                                      li.name ||
                                      li.description ||
                                      "-"}
                                  </td>
                                  <td className="px-4 py-2 text-purple-900">
                                    {li.required_qty || li.qty || "-"}
                                  </td>
                                  <td className="px-4 py-2 text-purple-900">
                                    {li.color_name || li.price || "-"}
                                  </td>
                                  {/* <td className="px-4 py-2 text-purple-900">
                                    {li.amount || li.total || "-"}
                                  </td> */}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {/* <div className="rounded-xl bg-gray-50 p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      Raw Response
                    </h4>
                    <pre className="whitespace-pre-wrap text-sm text-purple-900">
                      {JSON.stringify(poDetail, null, 2)}
                    </pre>
                  </div> */}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
