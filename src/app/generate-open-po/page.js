"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/utils/url";
import Sidebar from "@/components/Sidebar";
import { Plus, Trash } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

export default function GenerateOpenPOPage() {
  const [vendorOptions, setVendorOptions] = useState([]);
  const [fabricTypeOptions, setFabricTypeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [accessoryOptions, setAccessoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [itemsData, setItemsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = localStorage.getItem("organizationId");
      setOrganizationId(orgs || "");
      // If you use supabase for auth, fetch accessToken here
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
      // Otherwise, set accessToken from your auth logic
    }
  }, [accessToken, organizationId]);

  useEffect(() => {
    // Fetch dropdowns
    async function fetchDropdowns() {
      try {
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        };
        const [
          vendorRes,
          fabricTypeRes,
          colorRes,
          accessoryRes,
          brandRes,
          sizeRes,
          unitRes,
        ] = await Promise.all([
          axios.get(`${API}partners/vendors`, { headers }),
          axios.get(`${API}so/fabric-type-suggestions`, { headers }),
          axios.get(`${API}so/color-suggestions`, { headers }),
          axios.get(`${API}so/accessory-suggestions`, { headers }),
          axios.get(`${API}so/brand-suggestions`, { headers }),
          axios.get(`${API}so/size-suggestions`, { headers }),
          axios.get(`${API}so/unit-suggestions`, { headers }),
        ]);
        console.log(vendorRes.data?.vendors);

        setVendorOptions(vendorRes.data?.vendors || []);
        setFabricTypeOptions(fabricTypeRes.data?.data || []);
        setColorOptions(colorRes.data?.data || []);
        setAccessoryOptions(accessoryRes.data?.data || []);
        setBrandOptions(brandRes.data?.data || []);
        setSizeOptions(sizeRes.data?.data || []);
        setUnitOptions(unitRes.data?.data || []);
      } catch (err) {
        setVendorOptions([]);
        setFabricTypeOptions([]);
        setColorOptions([]);
        setAccessoryOptions([]);
        setBrandOptions([]);
        setSizeOptions([]);
        setUnitOptions([]);
      }
    }
    if (accessToken && organizationId) {
      fetchDropdowns();
    }
  }, [accessToken, organizationId]);

  const handleAddFabric = () => {
    setItemsData([
      ...itemsData,
      {
        type: "fabric",
        fabric_type_id: "",
        gsm: "",
        dia: "",
        colors: [
          {
            color_id: "",
            required_qty: "",
            ordered_qty: "",
            moq: "",
            unit_id: "",
            rate_per_unit: "",
          },
        ],
      },
    ]);
  };

  const handleAddAccessory = () => {
    setItemsData([
      ...itemsData,
      {
        type: "accessory",
        accessories: [
          {
            accessory_id: "",
            required_qty: "",
            ordered_qty: "",
            brand_id: "",
            color_id: "",
            size_id: "",
            unit_id: "",
            rate_per_unit: "",
            notes: "",
          },
        ],
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      // Convert all number fields to numbers
      const payload = {
        vendor_id: Number(vendorId),
        items_data: itemsData.map((item) => {
          if (item.type === "fabric") {
            return {
              type: "fabric",
              fabric_type_id: Number(item.fabric_type_id),
              gsm: Number(item.gsm),
              dia: Number(item.dia),
              colors: item.colors.map((c) => ({
                color_id: Number(c.color_id),
                required_qty: Number(c.required_qty),
                ordered_qty: Number(c.required_qty),
                moq: Number(c.moq),
                unit_id: Number(c.unit_id),
                rate_per_unit: Number(c.rate_per_unit),
              })),
            };
          } else {
            return {
              type: "accessory",
              accessories: item.accessories.map((a) => ({
                accessory_id: Number(a.accessory_id),
                required_qty: Number(a.required_qty),
                ordered_qty: Number(a.required_qty),
                brand_id: Number(a.brand_id),
                color_id: Number(a.color_id),
                size_id: Number(a.size_id),
                unit_id: Number(a.unit_id),
                rate_per_unit: Number(a.rate_per_unit),
                notes: a.notes,
              })),
            };
          }
        }),
      };
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Organization-ID": organizationId,
      };
      await axios.post(`${API}so/po/open`, payload, { headers });
      setSuccessMsg("Open PO generated successfully!");
      setItemsData([]);
      setVendorId("");
    } catch (err) {
      setErrorMsg("Failed to generate PO.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-950">
          Generate Open PO
        </h1>
        {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
        {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="font-semibold text-blue-950 mb-2 block">
              Vendor
            </label>
            <select
              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[200px]"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
            >
              <option value="">Select Vendor</option>
              {vendorOptions.map((v) => (
                <option key={v.id || v.vendor_id} value={v.id || v.vendor_id}>
                  {v.name || v.vendor_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-blue-950 mb-2 block">
              Items
            </label>
            <div className="space-y-6">
              {itemsData.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-blue-200 rounded-xl p-4 bg-blue-50 mb-2"
                >
                  <div className="flex gap-4 mb-2">
                    <span>{item.type === "fabric" ? "Fabric" : "Trims"}</span>
                    <button
                      type="button"
                      className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                      onClick={() =>
                        setItemsData(itemsData.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash className="inline-block mr-1" />
                      Remove Item
                    </button>
                  </div>
                  {item.type === "fabric" ? (
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">
                            Fabric Type
                          </label>
                          <select
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[150px]"
                            value={item.fabric_type_id}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].fabric_type_id = e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          >
                            <option value="">Select Fabric Type</option>
                            {fabricTypeOptions.map((ft) => (
                              <option
                                key={ft.id || ft.fabric_type_id}
                                value={ft.id || ft.fabric_type_id}
                              >
                                {ft.name || ft.fabric_type_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">
                            GSM
                          </label>
                          <input
                            type="number"
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                            value={item.gsm}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].gsm = e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">
                            DIA
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                            value={item.dia}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].dia = e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-blue-700 font-medium mb-1">
                          Colors
                        </label>
                        {item.colors.map((c, ci) => (
                          <div key={ci} className="flex gap-2 mb-2">
                            <select
                              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                              value={c.color_id}
                              onChange={(e) => {
                                const newItems = [...itemsData];
                                newItems[idx].colors[ci].color_id =
                                  e.target.value;
                                setItemsData(newItems);
                              }}
                              required
                            >
                              <option value="">Select Color</option>
                              {colorOptions.map((col) => (
                                <option
                                  key={col.id || col.color_id}
                                  value={col.id || col.color_id}
                                >
                                  {col.name || col.color_name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Required Qty"
                              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                              value={c.required_qty}
                              onChange={(e) => {
                                const newItems = [...itemsData];
                                newItems[idx].colors[ci].required_qty =
                                  e.target.value;
                                setItemsData(newItems);
                              }}
                              required
                            />
                            {/* <input
                              type="number"
                              placeholder="Ordered Qty"
                              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                              value={c.ordered_qty}
                              onChange={(e) => {
                                const newItems = [...itemsData];
                                newItems[idx].colors[ci].ordered_qty =
                                  e.target.value;
                                setItemsData(newItems);
                              }}
                              required
                            /> */}
                            <input
                              type="number"
                              placeholder="MOQ"
                              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                              value={c.moq}
                              onChange={(e) => {
                                const newItems = [...itemsData];
                                newItems[idx].colors[ci].moq = e.target.value;
                                setItemsData(newItems);
                              }}
                              required
                            />
                            <select
                              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                              value={c.unit_id}
                              onChange={(e) => {
                                const newItems = [...itemsData];
                                newItems[idx].colors[ci].unit_id =
                                  e.target.value;
                                setItemsData(newItems);
                              }}
                              required
                            >
                              <option value="">Select Unit</option>
                              {unitOptions.map((u) => (
                                <option
                                  key={u.id || u.unit_id}
                                  value={u.id || u.unit_id}
                                >
                                  {u.name || u.unit_name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Rate/Unit"
                              className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                              value={c.rate_per_unit}
                              onChange={(e) => {
                                const newItems = [...itemsData];
                                newItems[idx].colors[ci].rate_per_unit =
                                  e.target.value;
                                setItemsData(newItems);
                              }}
                              required
                            />
                            <button
                              type="button"
                              className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                              onClick={() => {
                                const newItems = [...itemsData];
                                newItems[idx].colors = newItems[
                                  idx
                                ].colors.filter((_, i) => i !== ci);
                                setItemsData(newItems);
                              }}
                              disabled={item.colors.length === 1}
                            >
                              <Trash className="inline-block mr-1" />
                              Remove Color
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-blue-700 font-semibold"
                          onClick={() => {
                            const newItems = [...itemsData];
                            newItems[idx].colors.push({
                              color_id: "",
                              required_qty: "",
                              ordered_qty: "",
                              moq: "",
                              unit_id: "",
                              rate_per_unit: "",
                            });
                            setItemsData(newItems);
                          }}
                        >
                          <Plus className="inline-block mr-1" />
                          Add Color
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-blue-700 font-medium mb-1">
                        Accessories
                      </label>
                      {item.accessories.map((a, ai) => (
                        <div
                          key={ai}
                          className="flex flex-wrap gap-2 mb-2 border border-blue-100 rounded-lg p-3 bg-white"
                        >
                          <select
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                            value={a.accessory_id}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].accessory_id =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          >
                            <option value="">Select Accessory</option>
                            {accessoryOptions.map((acc) => (
                              <option
                                key={acc.id || acc.accessory_id}
                                value={acc.id || acc.accessory_id}
                              >
                                {acc.name || acc.accessory_name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                            value={a.brand_id}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].brand_id =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                          >
                            <option value="">Select Brand</option>
                            {brandOptions.map((brand) => (
                              <option
                                key={brand.id || brand.brand_id}
                                value={brand.id || brand.brand_id}
                              >
                                {brand.name || brand.brand_name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                            value={a.color_id}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].color_id =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                          >
                            <option value="">Select Color</option>
                            {colorOptions.map((color) => (
                              <option
                                key={color.id || color.color_id}
                                value={color.id || color.color_id}
                              >
                                {color.name || color.color_name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                            value={a.size_id}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].size_id =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                          >
                            <option value="">Select Size</option>
                            {sizeOptions.map((size) => (
                              <option
                                key={size.id || size.size_id}
                                value={size.id || size.size_id}
                              >
                                {size.name || size.size_name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Required Qty"
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                            value={a.required_qty}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].required_qty =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          />
                          {/* <input
                            type="number"
                            placeholder="Ordered Qty"
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                            value={a.ordered_qty}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].ordered_qty =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          /> */}
                          <select
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                            value={a.unit_id}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].unit_id =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          >
                            <option value="">Select Unit</option>
                            {unitOptions.map((unit) => (
                              <option
                                key={unit.id || unit.unit_id}
                                value={unit.id || unit.unit_id}
                              >
                                {unit.name || unit.unit_name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Rate/Unit"
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[80px]"
                            value={a.rate_per_unit}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].rate_per_unit =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                            required
                          />
                          <input
                            type="text"
                            placeholder="Notes"
                            className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                            value={a.notes}
                            onChange={(e) => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories[ai].notes =
                                e.target.value;
                              setItemsData(newItems);
                            }}
                          />
                          <button
                            type="button"
                            className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                            onClick={() => {
                              const newItems = [...itemsData];
                              newItems[idx].accessories = newItems[
                                idx
                              ].accessories.filter((_, i) => i !== ai);
                              setItemsData(newItems);
                            }}
                            disabled={item.accessories.length === 1}
                          >
                            <Trash className="inline-block mr-1" />
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-blue-700 font-semibold"
                        onClick={() => {
                          const newItems = [...itemsData];
                          newItems[idx].accessories.push({
                            accessory_id: "",
                            required_qty: "",
                            ordered_qty: "",
                            brand_id: "",
                            color_id: "",
                            size_id: "",
                            unit_id: "",
                            rate_per_unit: "",
                            notes: "",
                          });
                          setItemsData(newItems);
                        }}
                      >
                        <Plus className="inline-block mr-1" />
                        Add Accessory
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-semibold flex items-center gap-2"
                  onClick={handleAddFabric}
                >
                  <Plus size={16} />
                  Add Fabric
                </button>
                <button
                  type="button"
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-700 font-semibold flex items-center gap-2"
                  onClick={handleAddAccessory}
                >
                  <Plus size={16} />
                  Add Accessory
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="bg-foreground text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 font-semibold transition w-full mt-2"
            disabled={loading}
          >
            {loading ? "Generating PO..." : "Generate PO"}
          </button>
        </form>
      </main>
    </div>
  );
}
