"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

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
  const [poSummary, setPoSummary] = useState([]);
  // Batch summary modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState("");
  const router = useRouter();

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
  const formatToIST = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const handleOpenBatchSummary = async (batchId) => {
    setBatchModalOpen(true);
    setBatchSummary(null);
    setBatchError("");
    setBatchLoading(true);
    try {
      const res = await axios.get(`${API}so/po-summary/batch/${batchId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      setBatchSummary(res?.data?.data || null);
    } catch (e) {
      setBatchError("Failed to fetch batch summary.");
    } finally {
      setBatchLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = localStorage.getItem("organizationId");
      setOrganizationId(orgs || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, []);

  useEffect(() => {
    const fetchPOSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const groupId = localStorage.getItem("group_id") || "";
        const res = await axios.get(`${API}so/po-summary/group/${groupId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        setPoSummary(res?.data?.data || []);
      } catch (err) {
        setError("Failed to fetch PO summary.");
      } finally {
        setLoading(false);
      }
    };
    if (accessToken && organizationId) fetchPOSummary();
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
        ) : poSummary.length === 0 ? (
          <div className="p-4 text-gray-500">No PO batches found.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-purple-200">
            {poSummary.map((batch, idx) => (
              <div
                key={batch.batch_id || idx}
                className="border-b border-gray-100 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <span className="mb-4 py-2 text-purple-900 font-semibold">
                    Batch Sl No. : {idx + 1}
                  </span>
                  <span className="mb-4 py-2 text-purple-900 font-semibold">
                    Created At : {formatToIST(batch.created_at)}
                  </span>

                  <span className="mb-4 py-2 text-purple-900 font-semibold">
                    Batch Description : {batch.description}
                  </span>
                </div>
                <br />

                <table className="min-w-full bg-white border border-purple-100 rounded">
                  <thead>
                    <tr className="text-left text-white border-b border-purple-200 bg-gradient-to-br from-purple-600 to-blue-400">
                      {/* <th className="px-2 py-1 text-left text-white font-bold">
                        PO Number
                      </th>
                      <th className="px-2 py-1 text-left text-white font-bold">
                        PO ID
                      </th> */}
                      <th className="px-2 py-1 text-left text-white font-bold">
                        Sl No.
                      </th>
                      <th className="px-2 py-1 text-left text-white font-bold">
                        Design Name
                      </th>
                      <th className="px-2 py-1 text-left text-white font-bold">
                        Vendor Name
                      </th>
                      <th className="px-2 py-1 text-left text-white font-bold">
                        Stauts
                      </th>
                      <th className="px-2 py-1 text-left text-white font-bold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.purchase_orders.map((po, pi) => (
                      <tr
                        key={po.po_id || pi}
                        className="border-b border-gray-100"
                      >
                        {/* <td className="px-2 py-1 text-purple-900">
                          {po.po_number}
                        </td>
                        <td className="px-2 py-1 text-purple-900">
                          {po.po_id}
                        </td> */}
                        <td className="px-2 py-1 text-purple-900">{pi + 1}</td>
                        <td className="px-2 py-1 text-purple-900">
                          {po.design_name}
                        </td>
                        <td className="px-2 py-1 text-purple-900">
                          {po.vendor_name ||
                            (po.vendor && po.vendor.name) ||
                            "-"}
                        </td>
                        <td className="px-2 py-1 text-purple-900">
                          {po.status || "-"}
                        </td>
                        <td className="px-2 py-1">
                          <button
                            className="px-2 py-1 bg-purple-600 text-white rounded shadow hover:bg-purple-700 text-xs mr-2"
                            onClick={() =>
                              router.push(`/view-design/view-po/${po.po_id}`)
                            }
                          >
                            View PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="mt-2 px-3 py-1 bg-purple-600 text-white rounded shadow hover:bg-purple-700 text-xs"
                  onClick={() => handleOpenBatchSummary(batch.batch_id)}
                >
                  View Batch Summary
                </button>
              </div>
            ))}
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
        {batchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setBatchModalOpen(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-purple-900">
                Batch Summary
              </h2>
              {batchLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : batchError ? (
                <div className="text-red-600">{batchError}</div>
              ) : !batchSummary ? (
                <div className="text-gray-500">No summary available.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                    {/* <div className="text-purple-900">
                      <span className="font-semibold">Batch :</span>{" "}
                      {batchSummary.batch_id}
                    </div> */}
                    <div className="text-purple-900">
                      <span className="font-semibold">Created At:</span>{" "}
                      {batchSummary.created_at}
                    </div>
                    {/* <div className="text-purple-900">
                      <span className="font-semibold">Created By:</span>{" "}
                      {batchSummary.created_by}
                    </div> */}
                    <div className="text-purple-900">
                      <span className="font-semibold">Description:</span>{" "}
                      {batchSummary.description}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Aggregated By Fabric
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-purple-200">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-purple-950 font-bold">
                            Fabric Name
                          </th>
                          <th className="px-4 py-2 text-left text-purple-950 font-bold">
                            Color Name
                          </th>
                          <th className="px-4 py-2 text-left text-purple-950 font-bold">
                            Total Ordered
                          </th>
                          <th className="px-4 py-2 text-left text-purple-950 font-bold">
                            Total Required
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchSummary.aggregated_by_fabric?.map((item, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="px-4 py-2 text-purple-900">
                              {item.fabric_type_name}
                            </td>
                            <td className="px-4 py-2 text-purple-900">
                              {item.color_name}
                            </td>
                            <td className="px-4 py-2 text-purple-900">
                              {item.total_ordered}
                            </td>
                            <td className="px-4 py-2 text-purple-900">
                              {item.total_required}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
