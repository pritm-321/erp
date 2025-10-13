"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import Sidebar from "@/components/Sidebar";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function OpenPOPage() {
  const [openPOs, setOpenPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [fabricModal, setFabricModal] = useState({ open: false, items: [] });
  const [accessoryModal, setAccessoryModal] = useState({
    open: false,
    items: [],
  });
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
    async function fetchOpenPOs() {
      setLoading(true);
      setErrorMsg("");
      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        };
        const res = await axios.get(`${API}so/po/open`, { headers });
        setOpenPOs(res.data?.data || []);
      } catch (err) {
        setOpenPOs([]);
        setErrorMsg("Failed to fetch open POs.");
      } finally {
        setLoading(false);
      }
    }
    if (accessToken && organizationId) {
      fetchOpenPOs();
    }
  }, [accessToken, organizationId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-3xl font-bold text-blue-950">
            Open Purchase Orders
          </h1>
          <button
            className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 font-semibold flex items-center gap-2"
            onClick={() => router.push("/generate-open-po")}
          >
            <Plus size={20} />
            Generate Open PO
          </button>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : errorMsg ? (
          <div className="text-red-600 mb-2">{errorMsg}</div>
        ) : openPOs.open_po_count === 0 ? (
          <div className="text-gray-500">No open purchase orders found.</div>
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
                    Fabric Items
                  </th>
                  <th className="px-4 py-2 text-left text-blue-950 font-bold">
                    Accessory Items
                  </th>
                </tr>
              </thead>
              <tbody>
                {openPOs.open_purchase_orders?.map((po) => (
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
                    <td className="px-4 py-2">
                      {po.status_name || po.status || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {po.fabric_items_count === 0 ? (
                        <span className="text-gray-500">-</span>
                      ) : (
                        <button
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded shadow hover:bg-blue-200 font-semibold"
                          onClick={() =>
                            setFabricModal({
                              open: true,
                              items: po.fabric_items,
                            })
                          }
                        >
                          View ({po.fabric_items_count})
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {po.accessory_items_count === 0 ? (
                        <span className="text-gray-500">-</span>
                      ) : (
                        <button
                          className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded shadow hover:bg-yellow-200 font-semibold"
                          onClick={() =>
                            setAccessoryModal({
                              open: true,
                              items: po.accessory_items,
                            })
                          }
                        >
                          View ({po.accessory_items_count})
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Fabric Items Modal */}
      {fabricModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative max-h-[95vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setFabricModal({ open: false, items: [] })}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-blue-950">
              Fabric Items
            </h2>
            {fabricModal.items.length === 0 ? (
              <div className="text-gray-500">No fabric items.</div>
            ) : (
              <table className="min-w-full bg-white border border-blue-100 rounded mb-2">
                <thead>
                  <tr className="bg-blue-50 text-xs">
                    <th className="px-2 py-1">Fabric</th>
                    <th className="px-2 py-1">GSM</th>
                    <th className="px-2 py-1">DIA</th>
                    <th className="px-2 py-1">Color</th>
                    <th className="px-2 py-1">Required Qty</th>
                    <th className="px-2 py-1">Ordered Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricModal.items.map((fi, fiIdx) => (
                    <tr key={fiIdx} className="border-b border-blue-50 text-xs">
                      <td className="px-2 py-1">
                        {fi.fabric_type_name || fi.fabric_type_id}
                      </td>
                      <td className="px-2 py-1">{fi.gsm}</td>
                      <td className="px-2 py-1">{fi.dia}</td>
                      <td className="px-2 py-1">
                        {fi.color_name || fi.color_id}
                      </td>
                      <td className="px-2 py-1">{fi.required_qty}</td>
                      <td className="px-2 py-1">{fi.ordered_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Accessory Items Modal */}
      {accessoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative max-h-[95vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setAccessoryModal({ open: false, items: [] })}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-yellow-700">
              Accessory Items
            </h2>
            {accessoryModal.items.length === 0 ? (
              <div className="text-gray-500">No accessory items.</div>
            ) : (
              <table className="min-w-full bg-white border border-yellow-100 rounded mb-2">
                <thead>
                  <tr className="bg-yellow-50 text-xs">
                    <th className="px-2 py-1">Accessory</th>
                    <th className="px-2 py-1">Brand</th>
                    <th className="px-2 py-1">Color</th>
                    <th className="px-2 py-1">Size</th>
                    <th className="px-2 py-1">Unit</th>
                    <th className="px-2 py-1">Rate/Unit</th>
                    <th className="px-2 py-1">Required Qty</th>
                    <th className="px-2 py-1">Ordered Qty</th>
                    <th className="px-2 py-1">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {accessoryModal.items.map((ai, aiIdx) => (
                    <tr
                      key={aiIdx}
                      className="border-b border-yellow-50 text-xs"
                    >
                      <td className="px-2 py-1">
                        {ai.accessory_name || ai.accessory_id}
                      </td>
                      <td className="px-2 py-1">{ai.brand_id}</td>
                      <td className="px-2 py-1">{ai.color_id}</td>
                      <td className="px-2 py-1">{ai.size_id}</td>
                      <td className="px-2 py-1">{ai.unit_id}</td>
                      <td className="px-2 py-1">{ai.rate_per_unit}</td>
                      <td className="px-2 py-1">{ai.required_qty}</td>
                      <td className="px-2 py-1">{ai.ordered_qty}</td>
                      <td className="px-2 py-1">{ai.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
