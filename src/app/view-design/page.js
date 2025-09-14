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
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const [createDesignModal, setCreateDesignModal] = useState(false);
  const router = useRouter();

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
                  className="p-6 rounded-xl shadow bg-gray-50 border border-purple-200"
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
                    Delivery Date: {""}
                    <span className="font-bold">
                      {formatToIST(delivery_date)}
                    </span>
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
