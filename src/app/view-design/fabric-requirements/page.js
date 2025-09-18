// filepath: /Users/pritamdas/Projects/Ujjwal/erp/src/app/view-design/fabric-requirements/page.js
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function FabricRequirementsPage() {
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
      const orgs = JSON.parse(localStorage.getItem("organizations"));
      setOrganizationId(orgs?.data?.joined?.[0]?.organization_id || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
      // read design id for PO generation/navigation
      const dId = localStorage.getItem("fabric_requirements_design_id") || "";
      setDesignId(dId);
    }
  }, []);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        setLoading(true);
        setError("");
        // const designId =
        //   typeof window !== "undefined"
        //     ? localStorage.getItem("fabric_requirements_design_id")
        //     : null;
        // if (!designId) {
        //   setError("No design selected.");
        //   setLoading(false);
        //   return;
        // }
        const { data } = await axios.get(
          `${API}so/fabric-requirements/${localStorage.getItem("group_id")}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Organization-ID": organizationId,
            },
          }
        );
        // console.log(data);

        setRequirements(data?.designs || {});
      } catch (err) {
        setError("Failed to fetch fabric requirements.");
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
        `${API}so/create-po/${localStorage.getItem("group_id")}`,
        { vendor_id: selectedVendor, design_ids: selectedDesignIds },
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
    ? sortedEntries.map((req) => req.design_id)
    : [];
  const isAllSelected =
    allDesignIds.length > 0 && selectedDesignIds.length === allDesignIds.length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-purple-950">
            Fabric Requirements
          </h1>
          {!loading && !error && requirements && requirements.length > 0 && (
            <button
              className=" px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
              onClick={handleOpenPOModal}
              disabled={selectedDesignIds.length === 0}
            >
              Generate PO
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
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
                <span className="font-semibold text-purple-900">
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
                  <h2 className="text-xl font-semibold text-purple-900">
                    Design Name : {req.design_name || `Design ${idx + 1}`}
                  </h2>
                  <h2 className="text-xl font-semibold text-purple-900">
                    Quantity : {req.quantity || 0}
                  </h2>
                  <h2 className="text-xl font-semibold text-purple-900">
                    Created Date : {formatToIST(req.created_at)}
                  </h2>
                </div>
                {req.fabric_requirements.length > 0 && (
                  <table className="w-full rounded-lg overflow-hidden mt-2">
                    <thead>
                      <tr className="text-left text-white border-b border-purple-200 bg-gradient-to-br from-purple-600 to-blue-400">
                        <th className="px-4 py-2">Fabric Type</th>
                        <th className="px-4 py-2">Color</th>
                        <th className="px-4 py-2">Consumption per Piece</th>
                        <th className="px-4 py-2">Total Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.fabric_requirements.map((fr, fidx) => (
                        <tr
                          key={fidx}
                          className="text-purple-900 border-b border-purple-100"
                        >
                          <td className="px-4 py-2">
                            {fr.fabric_type_name || fr.fabric_type_id}
                          </td>
                          <td className="px-4 py-2">
                            {fr.color_name || fr.color_id}
                          </td>
                          <td className="px-4 py-2">
                            {fr.consumption_per_piece}
                          </td>
                          <td className="px-4 py-2">{fr.total_required}</td>
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
                  className="bg-purple-600 text-white px-4 py-2 rounded w-full"
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
