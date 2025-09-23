"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";

export default function ViewPOByIdPage() {
  const router = useRouter();
  const params = useParams();
  const poId = params?.po_id;
  const [poDetail, setPoDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    const fetchPO = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axios.get(`${API}so/po/${poId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        // console.log(data.data);

        setPoDetail(data.data || null);
      } catch (err) {
        setError("Failed to fetch PO details.");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken && organizationId && poId) fetchPO();
  }, [accessToken, organizationId, poId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-950">PO Details</h1>
        {loading ? (
          <div className="p-4 text-gray-500">
            <div className="border-y-2 rounded-full w-16 h-16 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : !poDetail ? (
          <div className="p-4 text-gray-500">No details available.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-row gap-10 w-full">
              <Image
                src={poDetail.design_image || ""}
                alt="Design Image"
                width={500}
                height={500}
                className="w-48 h-48 object-cover rounded-lg shadow-lg border border-blue-200"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                {/* <div className="text-foreground">
                <span className="font-semibold">PO Number:</span>{" "}
                {poDetail.po_number || "-"}
              </div>
              <div className="text-foreground">
                <span className=    "font-semibold">PO ID:</span>{" "}
                {poDetail.po_id || "-"}
              </div> */}

                <div className="text-foreground">
                  <span className="font-semibold">Status:</span>{" "}
                  {poDetail.status || "-"}
                </div>
                <div className="text-foreground">
                  <span className="font-semibold">Vendor:</span>{" "}
                  {poDetail.vendor?.name || poDetail.vendor_name || "-"}
                </div>
                <div className="text-foreground">
                  <span className="font-semibold">Design Name:</span>{" "}
                  {poDetail.design?.name || poDetail.design_name || "-"}
                </div>

                <div className="text-foreground">
                  <span className="font-semibold">Order Date:</span>{" "}
                  {poDetail.order_date
                    ? new Date(poDetail.order_date).toLocaleString()
                    : poDetail.created_at || poDetail.date || "-"}
                </div>
              </div>
            </div>
            {Array.isArray(poDetail.items) && poDetail.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Line Items
                </h3>
                <div className="overflow-hidden rounded-xl border border-blue-200">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-white border-b border-blue-200 bg-gradient-to-br from-blue-600 to-blue-400">
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Fabric Name
                        </th>

                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Color Name
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          GSM
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          DIA
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Moq
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Ordered Qty
                        </th>
                        <th className="px-4 py-2 text-left text-blue-950 font-bold">
                          Required Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {poDetail.items.map((li, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-foreground">
                            {li.fabric_type_name ||
                              li.name ||
                              li.description ||
                              "-"}
                          </td>

                          <td className="px-4 py-2 text-foreground">
                            {li.color_name || "-"}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {li.gsm || "-"}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {li.dia || "-"}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {li.moq || li.moq || "-"}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {li.ordered_qty || li.qty || "-"}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {li.required_qty || li.qty || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
