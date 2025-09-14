"use client";
import Sidebar from "@/components/Sidebar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios, { all } from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import { Delete, DeleteIcon, Plus, Trash } from "lucide-react";

export default function GroupDesignsPage() {
  const searchParams = useSearchParams();
  const groupId = decodeURIComponent(searchParams.get("groupId"));
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [viewPartsModal, setViewPartsModal] = useState({
    open: false,
    designId: null,
  });
  const [uploadModal, setUploadModal] = useState({
    open: false,
    designId: null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [colorOptions, setColorOptions] = useState([]);
  const [fabricTypeOptions, setFabricTypeOptions] = useState([]);
  const [partOptions, setPartOptions] = useState([]);
  const [partsDetails, setPartsDetails] = useState([]);
  const [sizes, setSizes] = useState([{ size: "", ratio_component: "" }]);
  const [variants, setVariants] = useState([
    {
      variation: "",
      part_id: "",
      fabrics: [
        {
          fabric_type_id: "",
          colors: [{ color_id: "", is_base: false, consumption: "" }],
        },
      ],
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = JSON.parse(localStorage.getItem("organizations"));
      setOrganizationId(orgs?.data?.joined?.[0]?.organization_id || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, []);

  useEffect(() => {
    // const fetchDesigns = async () => {
    //   setLoading(true);
    //   setError("");
    //   try {
    //     // Fetch all designs and filter by groupId
    //     const res = await axios.get(
    //       `${API}design/merchant/${localStorage.getItem(
    //         "merchant_department_id"
    //       )}`,
    //       {
    //         headers: {
    //           Authorization: `Bearer ${accessToken}`,
    //           "Organization-ID": organizationId,
    //         },
    //       }
    //     );

    //     // Group logic: filter designs by groupId
    //     const allDesigns = res.data?.data?.designs || [];

    //     const grouped = {};
    //     allDesigns.forEach((d) => {
    //       const key = [
    //         d.party,
    //         d.order_quantity,
    //         d.design_type,
    //         d.mrp,
    //         d.rate,
    //         d.delivery_date,
    //       ].join("|");
    //       if (!grouped[key]) grouped[key] = [];
    //       grouped[key].push(d);
    //     });
    //     const groupedEntries = Object.entries(grouped);
    //     console.log(groupedEntries, " grouped designs");
    //     setDesigns(groupedEntries);
    //   } catch (err) {
    //     setError("Failed to fetch designs.");
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    if (accessToken && organizationId && groupId) {
      // fetchDesigns();
      // Fetch designs from localStorage for this group
      if (typeof window !== "undefined") {
        const allDesigns = JSON.parse(
          localStorage.getItem("selected_group_designs") || "[]"
        );
        setDesigns(allDesigns);
        setLoading(false);
      }
    }
  }, [accessToken, organizationId, groupId]);

  // Fetch dropdown options when modal opens
  useEffect(() => {
    if (uploadModal.open) {
      const fetchDropdowns = async () => {
        // Use global organizationId and accessToken
        try {
          const [colorRes, fabricRes, partRes] = await Promise.all([
            axios.get(`${API}so/color-suggestions`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
            axios.get(`${API}so/fabric-type-suggestions`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
            axios.get(`${API}design/suggestions/parts`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
          ]);
          setColorOptions(colorRes.data?.data || []);
          setFabricTypeOptions(fabricRes.data?.data || []);
          setPartOptions(partRes.data?.data || []);
        } catch (err) {
          setColorOptions([]);
          setFabricTypeOptions([]);
          setPartOptions([]);
        }
      };
      fetchDropdowns();
    }
  }, [uploadModal.open, organizationId, accessToken]);

  // Extract common group fields from first design
  const groupInfo =
    designs.length > 0
      ? {
          party: designs[0].party,
          order_quantity: designs[0].order_quantity,
          design_type: designs[0].design_type,
          mrp: designs[0].mrp,
          rate: designs[0].rate,
          delivery_date: designs[0].delivery_date,
        }
      : {};

  const handleViewParts = async (designId) => {
    try {
      const res = await axios.get(`${API}so/design/${designId}/parts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      console.log(res.data, " parts data");

      setPartsDetails(res.data || {});
      setViewPartsModal({ open: true, designId });
    } catch (err) {
      setPartsDetails([]);
      setViewPartsModal({ open: true, designId });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <h1 className="text-3xl font-bold mb-6 text-purple-900">
          Designs in Group
        </h1>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : designs.length === 0 ? (
          <div className="p-4 text-gray-500">
            No designs found in this group.
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-semibold text-purple-800">Party:</span>{" "}
                  <span className="font-bold">{groupInfo.party}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">
                    Order Quantity:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.order_quantity}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">
                    Design Type:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.design_type}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">MRP:</span>{" "}
                  <span className="font-bold">{groupInfo.mrp}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">Rate:</span>{" "}
                  <span className="font-bold">{groupInfo.rate}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-800">
                    Delivery Date:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.delivery_date}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border-gray-100 rounded-xl shadow">
                <thead className="bg-gradient-to-r from-purple-100 to-purple-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Image
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Design Name
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      PO
                    </th>
                    <th className="px-4 py-2 text-left text-purple-900 font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {designs.map((d) => (
                    <tr
                      key={d.design_id}
                      className="border-b border-gray-100 hover:bg-purple-50"
                    >
                      <td className="px-4 py-2">
                        <img
                          src={d.image_url || "/default-design.png"}
                          alt={d.design_name}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-purple-200"
                        />
                      </td>
                      <td className="px-4 py-2 font-semibold text-purple-900">
                        {d.design_name}
                      </td>
                      <td className="px-4 py-2 text-purple-700">{d.status}</td>
                      <td className="px-4 py-2 text-purple-700">{d.po}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition"
                            onClick={() => handleViewParts(d.design_id)}
                          >
                            View Parts
                          </button>
                          <button
                            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition"
                            onClick={() =>
                              setUploadModal({
                                open: true,
                                designId: d.design_id,
                              })
                            }
                          >
                            Upload Parts
                          </button>
                          <button className="bg-purple-600 text-white px-3 py-1 rounded shadow hover:bg-purple-700 transition text-sm">
                            View Fabric Requirements
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      {/* View Parts Modal */}
      {viewPartsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() =>
                setViewPartsModal({
                  open: false,
                  designId: null,
                })
              }
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Parts Details</h2>
            {partsDetails.fabric_requirements ? (
              <div className="text-gray-500">
                No parts found for this design.
              </div>
            ) : (
              <div className="space-y-4">
                {partsDetails.sizes?.map((part, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="font-semibold">Part Size: {part.size}</div>
                    <div className="ml-2">
                      <div className="font-medium">
                        Ratio Component : {part.ratio_component}
                      </div>
                    </div>
                  </div>
                ))}
                {partsDetails.variants?.map((part, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="font-semibold">
                      Part Variants:{" "}
                      {part.part_name || part.name || part.part_id}
                    </div>
                    {part.fabrics && (
                      <div className="ml-2">
                        <div className="font-medium">Fabrics:</div>
                        {part.fabrics.map((fab, fi) => (
                          <div key={fi} className="ml-2">
                            <div>
                              Type: {fab.fabric_type_name || fab.fabric_type_id}
                            </div>
                            {fab.colors && (
                              <div className="ml-2">
                                <div className="font-medium">Colors:</div>
                                {fab.colors.map((col, ci) => (
                                  <div key={ci} className="ml-2 flex gap-2">
                                    <div>ID: {col.color_id}</div>
                                    <div>
                                      Name: {col.color_name || col.name}
                                    </div>
                                    <div>
                                      Base: {col.is_base ? "Yes" : "No"}
                                    </div>
                                    <div>Consumption: {col.consumption}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Upload Modal */}
      {uploadModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-5xl w-full relative max-h-[95vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() =>
                setUploadModal({
                  open: false,
                  designId: null,
                })
              }
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Upload Design Data</h2>
            {uploadError && (
              <div className="text-red-600 mb-2">{uploadError}</div>
            )}
            {uploadSuccess && (
              <div className="text-green-600 mb-2">{uploadSuccess}</div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUploadLoading(true);
                setUploadError("");
                setUploadSuccess("");
                // Automatically set variation values
                const autoVariants = variants.map((v, idx) => ({
                  ...v,
                  variation: String(idx + 1),
                }));
                try {
                  await axios.post(
                    `${API}so/update-data/${uploadModal.designId}`,
                    { sizes, variants: autoVariants },
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Organization-ID": organizationId,
                      },
                    }
                  );
                  setUploadSuccess("Design data uploaded successfully!");
                  setUploadModal({
                    open: false,
                    designId: null,
                  });
                } catch (err) {
                  setUploadError("Failed to upload design data.");
                } finally {
                  setUploadLoading(false);
                }
              }}
              className="space-y-6"
            >
              <div className="mb-4">
                <label className="block font-bold text-xl mb-1 text-purple-800">
                  Sizes
                </label>
                {sizes.map((sz, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Size"
                      className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-24"
                      value={sz.size}
                      onChange={(e) => {
                        const newSizes = [...sizes];
                        newSizes[i].size = e.target.value;
                        setSizes(newSizes);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Ratio Component"
                      className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white "
                      value={sz.ratio_component}
                      onChange={(e) => {
                        const newSizes = [...sizes];
                        newSizes[i].ratio_component = e.target.value;
                        setSizes(newSizes);
                      }}
                    />
                    <button
                      type="button"
                      className="text-red-500 font-semibold"
                      onClick={() =>
                        setSizes(sizes.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash className="inline-block mr-1" />
                      Remove Size
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-purple-600  font-semibold"
                  onClick={() =>
                    setSizes([
                      ...sizes,
                      {
                        size: "",
                        ratio_component: "",
                      },
                    ])
                  }
                >
                  <Plus className="inline-block mr-1" />
                  Add Size
                </button>
              </div>
              <div className="mb-4 ">
                <label className="block font-bold text-xl text-purple-800 mb-2">
                  Variants
                </label>
                <div className="space-y-6 max-h-[450px] overflow-y-auto">
                  {variants.map((v, vi) => (
                    <div
                      key={vi}
                      className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-700 font-bold text-lg">
                          Variant #{vi + 1}
                        </span>
                        <button
                          type="button"
                          className="text-red-500 font-semibold px-3 py-1 rounded hover:bg-red-50"
                          onClick={() =>
                            setVariants(variants.filter((_, idx) => idx !== vi))
                          }
                        >
                          <Trash className="inline-block mr-1" />
                          Remove Variant
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center mb-2">
                        <div className="flex flex-col">
                          <label className="text-purple-700 font-medium mb-1">
                            Part
                          </label>
                          <select
                            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-w-[150px]"
                            value={v.part_id}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[vi].part_id = e.target.value;
                              setVariants(newVariants);
                            }}
                          >
                            <option value="">Select Part</option>
                            {partOptions.map((p) => (
                              <option
                                key={p.id || p.part_id}
                                value={p.id || p.part_id}
                              >
                                {p.name || p.part_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        {v.fabrics.map((f, fi) => (
                          <div
                            key={fi}
                            className="rounded-xl border border-purple-100 bg-white p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-purple-700 font-medium">
                                Fabric #{fi + 1}
                              </span>
                              <button
                                type="button"
                                className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                onClick={() => {
                                  const newVariants = [...variants];
                                  newVariants[vi].fabrics = newVariants[
                                    vi
                                  ].fabrics.filter((_, idx) => idx !== fi);
                                  setVariants(newVariants);
                                }}
                              >
                                <Trash className="inline-block mr-1" />
                                Remove Fabric
                              </button>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
                              <div className="flex flex-col">
                                <label className="text-purple-700 font-medium mb-1">
                                  Fabric Type
                                </label>
                                <select
                                  className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-w-[150px]"
                                  value={f.fabric_type_id}
                                  onChange={(e) => {
                                    const newVariants = [...variants];
                                    newVariants[vi].fabrics[fi].fabric_type_id =
                                      e.target.value;
                                    setVariants(newVariants);
                                  }}
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
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                              <label className="text-purple-700 font-medium mb-1">
                                Colors
                              </label>
                              {f.colors.map((c, ci) => (
                                <div
                                  key={ci}
                                  className="flex flex-wrap gap-2 items-center mb-1"
                                >
                                  <select
                                    className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-w-[120px]"
                                    value={c.color_id}
                                    onChange={(e) => {
                                      const newVariants = [...variants];
                                      newVariants[vi].fabrics[fi].colors[
                                        ci
                                      ].color_id = e.target.value;
                                      setVariants(newVariants);
                                    }}
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
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={!!c.is_base}
                                      onChange={(e) => {
                                        const newVariants = [...variants];
                                        newVariants[vi].fabrics[fi].colors[
                                          ci
                                        ].is_base = e.target.checked;
                                        setVariants(newVariants);
                                      }}
                                    />
                                    <span className="text-purple-700">
                                      Base
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Consumption"
                                    className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-24"
                                    value={c.consumption}
                                    onChange={(e) => {
                                      const newVariants = [...variants];
                                      newVariants[vi].fabrics[fi].colors[
                                        ci
                                      ].consumption = e.target.value;
                                      setVariants(newVariants);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                    onClick={() => {
                                      const newVariants = [...variants];
                                      newVariants[vi].fabrics[fi].colors =
                                        newVariants[vi].fabrics[
                                          fi
                                        ].colors.filter((_, idx) => idx !== ci);
                                      setVariants(newVariants);
                                    }}
                                  >
                                    <Trash className="inline-block mr-1" />
                                    Remove Color
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="text-purple-600  font-semibold"
                                onClick={() => {
                                  const newVariants = [...variants];
                                  newVariants[vi].fabrics[fi].colors.push({
                                    color_id: "",
                                    is_base: false,
                                    consumption: "",
                                  });
                                  setVariants(newVariants);
                                }}
                              >
                                <Plus className="inline-block mr-1" />
                                Add Color
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-purple-600  font-semibold"
                          onClick={() => {
                            const newVariants = [...variants];
                            newVariants[vi].fabrics.push({
                              fabric_type_id: "",
                              colors: [
                                {
                                  color_id: "",
                                  is_base: false,
                                  consumption: "",
                                },
                              ],
                            });
                            setVariants(newVariants);
                          }}
                        >
                          <Plus className="inline-block mr-1" />
                          Add Fabric
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-purple-600  font-semibold"
                    onClick={() =>
                      setVariants([
                        ...variants,
                        {
                          variation: "",
                          part_id: "",
                          fabrics: [
                            {
                              fabric_type_id: "",
                              colors: [
                                {
                                  color_id: "",
                                  is_base: false,
                                  consumption: "",
                                },
                              ],
                            },
                          ],
                        },
                      ])
                    }
                  >
                    <Plus className="inline-block mr-1" />
                    Add Variant
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="bg-gradient-to-br from-purple-400 to-purple-600 text-white px-6 py-3 rounded-xl shadow hover:from-purple-500 hover:to-purple-800 font-semibold transition w-full mt-2"
                disabled={uploadLoading}
              >
                {uploadLoading ? "Uploading..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
