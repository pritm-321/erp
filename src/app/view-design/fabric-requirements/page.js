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
  // PO modal state
  const [poModal, setPoModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState("");
  const [poSuccess, setPoSuccess] = useState("");
  const router = useRouter();

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
        const designId =
          typeof window !== "undefined"
            ? localStorage.getItem("fabric_requirements_design_id")
            : null;
        if (!designId) {
          setError("No design selected.");
          setLoading(false);
          return;
        }
        const res = await axios.get(
          `${API}so/fabric-requirements/${designId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Organization-ID": organizationId,
            },
          }
        );
        setRequirements(res.data?.fabric_requirements || []);
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

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!designId) {
      setPoError("No design selected for PO.");
      return;
    }
    setPoLoading(true);
    setPoError("");
    setPoSuccess("");
    try {
      const res = await axios.post(
        `${API}so/create-po/${designId}`,
        { vendor_id: selectedVendor },
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
          JSON.stringify(res?.data || { design_id: designId })
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <h1 className="text-3xl font-bold mb-6 text-purple-950">
          Fabric Requirements
        </h1>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : !requirements || requirements.length === 0 ? (
          <div className="p-4 text-gray-500">No data found.</div>
        ) : (
          <div className="space-y-4">
            {requirements.map((req, idx) => (
              <div key={idx} className="rounded-xl p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-purple-900">
                    <span className="font-semibold">Color:</span>{" "}
                    {req.color_name || req.color_id}
                  </div>
                  <div className="text-purple-900">
                    <span className="font-semibold">Fabric Type:</span>{" "}
                    {req.fabric_type_name || req.fabric_type_id}
                  </div>
                  <div className="text-purple-900">
                    <span className="font-semibold">
                      Consumption per Piece:
                    </span>{" "}
                    {req.consumption_per_piece}
                  </div>
                  <div className="text-purple-900">
                    <span className="font-semibold">Total Required:</span>{" "}
                    {req.total_required}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && requirements && requirements.length > 0 && (
          <button
            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            onClick={handleOpenPOModal}
          >
            Generate PO
          </button>
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
