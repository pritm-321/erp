// filepath: /Users/pritamdas/Projects/Ujjwal/erp/src/app/view-design/trims-requirements/page.js
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";

export default function TrimsRequirementsPage() {
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [designId, setDesignId] = useState("");
  const [selectedDesignIds, setSelectedDesignIds] = useState([]);
  // PO modal state
  const [poModal, setPoModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState("");
  const [poSuccess, setPoSuccess] = useState("");
  const router = useRouter();
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
    const fetchRequirements = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axios.get(
          `${API}so/trims-requirements/${localStorage.getItem(
            "group_id"
          )}/type/${localStorage.getItem("accessory_type_id")}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Organization-ID": organizationId,
            },
          }
        );
        // Response: { designs: [...] }
        console.log(data);

        setRequirements(data?.data?.designs || {});
      } catch (err) {
        setError("Failed to fetch trims requirements.");
      } finally {
        setLoading(false);
      }
    };
    if (accessToken && organizationId) fetchRequirements();
  }, [accessToken, organizationId]);

  const handleOpenPOModal = async () => {
    setPoModal(true);
    setVendors([]);
    setSelectedVendor("");
    setPoError("");
    setPoSuccess("");
    setPoLoading(true);
    try {
      const res = await axios.get(`${API}partners/vendors`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      setVendors(res.data?.vendors || []);
    } catch (err) {
      setPoError("Failed to fetch vendors.");
    } finally {
      setPoLoading(false);
    }
  };
  let sortedEntries = requirements;
  console.log(sortedEntries);

  if (sortedEntries && Array.isArray(sortedEntries)) {
    sortedEntries = sortedEntries.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
  }

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (selectedDesignIds.length === 0) {
      setPoError("No designs selected for PO.");
      return;
    }
    setPoLoading(true);
    setPoError("");
    setPoSuccess("");
    try {
      const res = await axios.post(
        `${API}so/create-trims-po/${localStorage.getItem("group_id")}`,
        {
          vendor_id: selectedVendor,
          design_ids: selectedDesignIds,
          accessory_type_id: localStorage.getItem("accessory_type_id"),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        }
      );
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "last_generated_po",
          JSON.stringify(res?.data || { design_ids: selectedDesignIds })
        );
      }
      router.push("/view-design/view-po");
      return;
    } catch (err) {
      setPoError("Failed to generate PO.");
    } finally {
      setPoLoading(false);
    }
  };

  // Add select all logic
  const allDesignIds = sortedEntries
    ? sortedEntries?.map((req) => req.design_id)
    : [];
  const isAllSelected =
    allDesignIds.length > 0 && selectedDesignIds.length === allDesignIds.length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-950">
            Trims Requirements
          </h1>
          {!loading && !error && requirements && requirements.length > 0 && (
            <button
              className=" px-6 py-3 bg-foreground text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
              onClick={handleOpenPOModal}
              disabled={selectedDesignIds.length === 0}
            >
              <Folder size={20} />
              Generate PO
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-4 text-gray-500">
            <div className="border-y-2 rounded-full w-16 h-16 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : !requirements || requirements.length === 0 ? (
          <div className="p-4 text-gray-500">No data found.</div>
        ) : (
          <div className="space-y-4">
            {!loading && !error && requirements && requirements.length > 0 && (
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDesignIds(allDesignIds);
                    } else {
                      setSelectedDesignIds([]);
                    }
                  }}
                  className="mr-2"
                />
                <span className="font-semibold text-foreground">
                  Select All To Generate PO
                </span>
              </div>
            )}
            {sortedEntries.map((req, idx) => (
              <div
                key={idx}
                className="rounded-xl p-4 bg-gray-50 flex flex-col shadow"
              >
                <div className="flex gap-6 items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedDesignIds.includes(req.design_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDesignIds([
                          ...selectedDesignIds,
                          req.design_id,
                        ]);
                      } else {
                        setSelectedDesignIds(
                          selectedDesignIds.filter((id) => id !== req.design_id)
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <h2 className="text-xl font-semibold text-foreground">
                    Design Name : {req.design_name || `Design ${idx + 1}`}
                  </h2>
                  <h2 className="text-xl font-semibold text-foreground">
                    Quantity : {req.quantity || 0}
                  </h2>
                  <h2 className="text-xl font-semibold text-foreground">
                    Created Date : {formatToIST(req.created_at)}
                  </h2>
                </div>
                {req.accessory_requirements &&
                  req.accessory_requirements.length > 0 && (
                    <table className="w-full rounded-lg overflow-hidden mt-2">
                      <thead>
                        <tr className="text-left text-white border-b border-blue-200 bg-foreground">
                          <th className="px-4 py-2">Trim Name</th>
                          <th className="px-4 py-2">Trim Type</th>
                          <th className="px-4 py-2">Brand</th>
                          <th className="px-4 py-2">Color</th>
                          <th className="px-4 py-2">Size</th>
                          <th className="px-4 py-2">Unit</th>
                          <th className="px-4 py-2">Rate/Unit</th>
                          <th className="px-4 py-2">Required Qty</th>
                          <th className="px-4 py-2">Total Cost</th>
                          <th className="px-4 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.accessory_requirements.map((acc, ai) => (
                          <tr
                            key={ai}
                            className="text-foreground border-b border-blue-100"
                          >
                            <td className="px-4 py-2">
                              {acc.accessory_name || acc.accessory_id}
                            </td>
                            <td className="px-4 py-2">
                              {acc.accessory_type || acc.accessory_id}
                            </td>
                            <td className="px-4 py-2">
                              {acc.brand_name || acc.brand_id}
                            </td>
                            <td className="px-4 py-2">
                              {acc.color_name || acc.color_id}
                            </td>
                            <td className="px-4 py-2">
                              {acc.size_label || acc.size_id}
                            </td>
                            <td className="px-4 py-2">
                              {acc.unit_name || acc.unit_id}
                            </td>
                            <td className="px-4 py-2">{acc.rate_per_unit}</td>
                            <td className="px-4 py-2">{acc.required_qty}</td>
                            <td className="px-4 py-2">{acc.total_cost}</td>
                            <td className="px-4 py-2">{acc.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            ))}
          </div>
        )}

        {poModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setPoModal(false)}
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">Generate PO</h2>
              {poError && <div className="text-red-600 mb-2">{poError}</div>}
              {poSuccess && (
                <div className="text-green-600 mb-2">{poSuccess}</div>
              )}
              <form onSubmit={handleSubmitPO}>
                <label className="block mb-2 font-medium">Select Vendor</label>
                <select
                  className="border px-2 py-1 rounded w-full mb-4"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                >
                  <option value="">Choose a vendor</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-foreground text-white px-4 py-2 rounded w-full"
                  disabled={poLoading}
                >
                  {poLoading ? "Generating..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
