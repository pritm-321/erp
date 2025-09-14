"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/utils/supabaseClient";
import { API } from "@/utils/url";
import { Upload } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CreateDesignForm from "@/components/CreateDesignForm";
import { useRouter } from "next/navigation";

export default function ViewDesign() {
  const [fabricModal, setFabricModal] = useState({
    open: false,
    designId: null,
  });
  const [fabricRequirements, setFabricRequirements] = useState(null);
  const [fabricLoading, setFabricLoading] = useState(false);
  const [fabricError, setFabricError] = useState("");

  const [poModal, setPoModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState("");
  const [poSuccess, setPoSuccess] = useState("");

  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const [createDesignModal, setCreateDesignModal] = useState(false);
  const router = useRouter();

  const [design, setDesign] = useState([]);
  const [merchant, setMerchant] = useState(null);
  const [error, setError] = useState("");
  const [designs, setDesigns] = useState([]);
  const [expandedDesigns, setExpandedDesigns] = useState([]);

  useEffect(() => {
    const fetchMerchantAndDesign = async () => {
      setError("");
      try {
        let organizationId = "";
        if (typeof window !== "undefined") {
          const orgs = JSON.parse(localStorage.getItem("organizations"));
          organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
        }

        const accessToken = await supabase.auth
          .getSession()
          .then(({ data }) => data?.session?.access_token);
        // Fetch merchant details first
        const merchantRes = await axios.get(`${API}emp/departments/Merchant`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        // console.log(merchantRes.data.data.departments[0]);

        setMerchant(merchantRes.data);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "merchant_department_id",
            merchantRes.data?.data.departments[0]?.department_id || ""
          );
        }
        // console.log(merchantRes.data?.data.departments[0]?.department_id);

        // Then fetch design details
        const res = await axios.get(
          `${API}design/merchant/${merchantRes.data?.data.departments[0]?.department_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Organization-ID": organizationId,
            },
          }
        );
        // console.log(res.data.data.designs);

        setDesigns(res.data.data.designs); // Assuming we want the first design
      } catch (err) {
        setError("Failed to fetch merchant or design details.");
      }
    };
    fetchMerchantAndDesign();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = JSON.parse(localStorage.getItem("organizations"));
      setOrganizationId(orgs?.data?.joined?.[0]?.organization_id || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, []);

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }
  //   if (!design) {
  //     return <div className="p-4">Loading...</div>;
  //   }

  // Group designs by specified fields
  const grouped = {};
  designs.forEach((d) => {
    const key = [
      d.party,
      d.order_quantity,
      d.design_type,
      d.mrp,
      d.rate,
      d.delivery_date,
    ].join("|");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });
  const groupedEntries = Object.entries(grouped);

  const handleViewFabricRequirements = async (designId) => {
    setFabricModal({ open: true, designId });
    setFabricRequirements(null);
    setFabricLoading(true);
    setFabricError("");
    try {
      const res = await axios.get(`${API}so/fabric-requirements/${designId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      setFabricRequirements(res.data.fabric_requirements);
    } catch (err) {
      setFabricError("Failed to fetch fabric requirements.");
    } finally {
      setFabricLoading(false);
    }
  };

  const handleGeneratePO = async () => {
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
      setVendors(res.data.vendors || []);
    } catch (err) {
      setPoError("Failed to fetch vendors.");
    } finally {
      setPoLoading(false);
    }
  };

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    setPoLoading(true);
    setPoError("");
    setPoSuccess("");
    try {
      await axios.post(
        `${API}so/create-po/${fabricModal.designId}`,
        {
          vendor_id: selectedVendor,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        }
      );
      setPoSuccess("PO generated successfully!");
      setPoModal(false);
    } catch (err) {
      setPoError("Failed to generate PO.");
    } finally {
      setPoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="w-full mx-auto p-8  bg-white h-screen overflow-y-scroll">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-purple-900">
            Grouped Designs
          </h1>
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-700 transition font-semibold"
            onClick={() => setCreateDesignModal(true)}
          >
            + Create Design
          </button>
        </div>
        {groupedEntries.length === 0 ? (
          <div className="p-4 text-gray-500">
            No designs found or loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {groupedEntries.map(([key, group], idx) => {
              const [
                party,
                order_quantity,
                design_type,
                mrp,
                rate,
                delivery_date,
              ] = key.split("|");
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl shadow bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
                >
                  <div className="mb-2 text-lg font-semibold text-purple-800">
                    Party: <span className="font-bold">{party}</span>
                  </div>
                  <div className="mb-2">
                    Order Quantity:{" "}
                    <span className="font-bold">{order_quantity}</span>
                  </div>
                  <div className="mb-2">
                    Design Type:{" "}
                    <span className="font-bold">{design_type}</span>
                  </div>
                  <div className="mb-2">
                    MRP: <span className="font-bold">{mrp}</span>
                  </div>
                  <div className="mb-2">
                    Rate: <span className="font-bold">{rate}</span>
                  </div>
                  <div className="mb-2">
                    Delivery Date:{" "}
                    <span className="font-bold">{delivery_date}</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                      onClick={() => {
                        // Store all designs in this group in localStorage
                        if (typeof window !== "undefined") {
                          localStorage.setItem(
                            "selected_group_designs",
                            JSON.stringify(group)
                          );
                        }
                        // Redirect to group details page with groupId
                        router.push(`/view-design/${encodeURIComponent(key)}`);
                      }}
                    >
                      {expandedDesigns.includes(idx)
                        ? "Hide Design Details"
                        : "View Design Details"}
                    </button>
                  </div>
                  {expandedDesigns.includes(idx) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full relative">
                        <button
                          className="absolute top-4 right-4 text-gray-400 hover:text-purple-700 text-2xl font-bold"
                          onClick={() =>
                            setExpandedDesigns(
                              expandedDesigns.filter((i) => i !== idx)
                            )
                          }
                        >
                          &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-purple-900">
                          Designs in this group
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {group.map((d) => (
                            <div
                              key={d.design_id}
                              className="rounded-xl shadow p-6 flex flex-col items-center bg-gradient-to-br from-purple-100 to-purple-50"
                            >
                              <img
                                src={d.image_url || "/default-design.png"}
                                alt={d.design_name}
                                className="w-28 h-28 object-cover rounded-xl mb-3 border-2 border-purple-200"
                              />
                              <div className="font-bold text-xl mb-2 text-purple-900">
                                {d.design_name}
                              </div>
                              <div className="mb-1">
                                Status:{" "}
                                <span className="font-medium text-purple-700">
                                  {d.status}
                                </span>
                              </div>
                              <div className="mb-1">
                                PO:{" "}
                                <span className="font-medium text-purple-700">
                                  {d.po}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition"
                                  onClick={() =>
                                    handleViewFabricRequirements(d.design_id)
                                  }
                                >
                                  View Fabric Requirements
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Fabric Requirements Modal */}
        {fabricModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setFabricModal({ open: false, designId: null })}
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-4">
                Fabric Requirements
              </h2>
              {fabricLoading ? (
                <div>Loading...</div>
              ) : fabricError ? (
                <div className="text-red-600">{fabricError}</div>
              ) : fabricRequirements ? (
                <>
                  <div className="space-y-4">
                    {fabricRequirements.map((req, idx) => (
                      <div key={idx} className="border rounded p-4 bg-gray-50">
                        <h3 className="font-semibold mb-2">
                          Fabric Requirement #{idx + 1}
                        </h3>
                        <div>
                          Color ID:{" "}
                          <span className="font-medium">{req.color_id}</span>
                        </div>
                        <div>
                          Color Name:{" "}
                          <span className="font-medium">{req.color_name}</span>
                        </div>
                        <div>
                          Consumption per Piece:{" "}
                          <span className="font-medium">
                            {req.consumption_per_piece}
                          </span>
                        </div>
                        <div>
                          Fabric Type ID:{" "}
                          <span className="font-medium">
                            {req.fabric_type_id}
                          </span>
                        </div>
                        <div>
                          Fabric Type Name:{" "}
                          <span className="font-medium">
                            {req.fabric_type_name}
                          </span>
                        </div>
                        <div>
                          Total Required:{" "}
                          <span className="font-medium">
                            {req.total_required}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition w-full"
                    onClick={handleGeneratePO}
                  >
                    Generate PO
                  </button>
                </>
              ) : (
                <div>No data found.</div>
              )}
            </div>
          </div>
        )}
        {/* PO Modal */}
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
                  {vendors?.map((v) => (
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
        {/* Create Design Modal */}
        {createDesignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-purple-700 text-2xl font-bold"
                onClick={() => setCreateDesignModal(false)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-6 text-purple-900">
                Create Design
              </h2>
              <CreateDesignForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
