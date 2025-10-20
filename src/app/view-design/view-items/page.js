"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import { API } from "@/utils/url";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function ViewItemDetailsPage() {
  const [fabricDetails, setFabricDetails] = useState([]);
  const [accessoryDetails, setAccessoryDetails] = useState([]);
  const [description, setDescription] = useState("");
  const [design, setDesign] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");

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
    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const referenceId = localStorage.getItem("reference_id");
        if (!referenceId) {
          setError("Reference ID not found in local storage.");
          setLoading(false);
          return;
        }
        const res = await axios.get(`${API}so/po-ref/${referenceId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        const data = res.data?.data || {};
        setFabricDetails(data.fabric_details || []);
        setAccessoryDetails(data.accessory_details || []);
        setDescription(data.description || "");
        setDesign(data.design || null);
        setVendor(data.vendor || null);
      } catch (err) {
        setError("Failed to fetch details.");
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && organizationId) fetchDetails();
  }, [accessToken, organizationId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-950">Item Details</h1>
          {/* <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => router.back()}
          >
            Back
          </button> */}
        </div>
        {loading ? (
          <div className="p-4 text-gray-500">
            <div className="border-y-2 rounded-full w-16 h-16 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            {/* {description && (
              <div className="mb-6 p-4 bg-gray-50 border border-blue-200 rounded-lg">
                <p className="text-blue-950 font-semibold">Description:</p>
                <p>{description}</p>
              </div>
            )} */}
            {design && (
              <div className="mb-6 p-4 bg-gray-50 border border-blue-200 rounded-lg">
                <p className="text-blue-950 font-semibold">
                  Design Name: {design.design_name || "-"}
                </p>

                <p className="text-blue-950 font-semibold">
                  Vendor: {vendor.vendor_name || "-"}
                </p>

                {design.design_image && (
                  <img
                    src={design.design_image}
                    alt={design.design_name}
                    className="mt-2 w-32 h-32 object-cover rounded-lg border"
                  />
                )}
              </div>
            )}
            {/* {vendor && (
              <div className="mb-6 p-4 bg-gray-50 border border-blue-200 rounded-lg">
                <p className="text-blue-950 font-semibold">Vendor:</p>
                <p>{vendor.vendor_name || "-"}</p>
              </div>
            )} */}
            {fabricDetails.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-blue-950 mb-4">
                  Fabric Details
                </h2>
                <div className="overflow-hidden rounded-xl border border-blue-200 bg-white">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Fabric Name
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          GSM
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          DIA
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Color
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Required Qty
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Ordered Qty
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Unit
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Rate/Unit
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fabricDetails.map((fabric, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-blue-50"
                        >
                          <td className="px-4 py-2">
                            {fabric.fabric_type_name || "-"}
                          </td>
                          <td className="px-4 py-2">{fabric.gsm || "-"}</td>
                          <td className="px-4 py-2">{fabric.dia || "-"}</td>
                          <td className="px-4 py-2">
                            {fabric.color_name || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {fabric.total_required_qty || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {fabric.total_ordered_qty || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {fabric.unit_name || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {fabric.rate_per_unit || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {fabric.total_cost || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {accessoryDetails.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-blue-950 mb-4">
                  Trims Details
                </h2>
                <div className="overflow-hidden rounded-xl border border-yellow-100 bg-white">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead className="bg-yellow-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Trims Name
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Brand
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Color
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Size
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Required Qty
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Ordered Qty
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Unit
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Rate/Unit
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Total Cost
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessoryDetails.map((accessory, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-blue-50"
                        >
                          <td className="px-4 py-2">
                            {accessory.accessory_name || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.accessory_type || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.brand_name || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.color_name || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.size_label || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.total_required_qty || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.total_ordered_qty || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.unit_name || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.rate_per_unit || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.total_cost || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {accessory.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
