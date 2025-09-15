"use client";
import Sidebar from "@/components/Sidebar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios, { all } from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import { Delete, DeleteIcon, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = JSON.parse(localStorage.getItem("organizations"));
      setOrganizationId(orgs?.data?.joined?.[0]?.organization_id || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, [accessToken, organizationId]);

  useEffect(() => {
    if (accessToken && organizationId && groupId) {
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
      // console.log(res.data, " parts data");

      setPartsDetails(res.data || {});

      setViewPartsModal({ open: true, designId });
      setSizes(res.data.sizes);

      setVariants(res.data.variants);
    } catch (err) {
      setPartsDetails([]);
      setViewPartsModal({ open: true, designId });
    }
  };

  const handleOpenUploadModal = (designId) => {
    setUploadModal({ open: true, designId });
    handleViewParts(designId);
  };

  const handleViewFabricRequirementsNav = (designId) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fabric_requirements_design_id", String(designId));
    }
    router.push("/view-design/fabric-requirements");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <h1 className="text-3xl font-bold mb-6 text-purple-950">
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
            <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-semibold text-purple-950">Party:</span>{" "}
                  <span className="font-bold">{groupInfo.party}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-950">
                    Order Quantity:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.order_quantity}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-950">
                    Design Type:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.design_type}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-950">MRP:</span>{" "}
                  <span className="font-bold">{groupInfo.mrp}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-950">Rate:</span>{" "}
                  <span className="font-bold">{groupInfo.rate}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-950">
                    Delivery Date:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.delivery_date}</span>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-purple-200">
              <table className="min-w-full bg-white  rounded-xl  shadow">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-purple-950 font-bold">
                      Image
                    </th>
                    <th className="px-4 py-2 text-left text-purple-950 font-bold">
                      Design Name
                    </th>
                    <th className="px-4 py-2 text-left text-purple-950 font-bold">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-purple-950 font-bold">
                      PO
                    </th>
                    <th className="px-4 py-2 text-left text-purple-950 font-bold">
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
                      <td className="px-4 py-2 font-semibold text-purple-950">
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
                            onClick={() => handleOpenUploadModal(d.design_id)}
                          >
                            Upload Parts
                          </button>
                          <button
                            className="bg-purple-600 text-white px-3 py-1 rounded shadow hover:bg-purple-700 transition text-sm"
                            onClick={() =>
                              handleViewFabricRequirementsNav(d.design_id)
                            }
                          >
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
          <div className="bg-gray-50 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-purple-700 text-2xl font-bold"
              onClick={() =>
                setViewPartsModal({
                  open: false,
                  designId: null,
                })
              }
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-purple-950">
              Parts Details
            </h2>
            {partsDetails.fabric_requirements ? (
              <div className="text-gray-500">
                No parts found for this design.
              </div>
            ) : (
              <div className="space-y-6">
                {partsDetails.sizes?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-purple-950 mb-2">
                      Sizes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* {partsDetails.sizes.map((part, idx) => ( */}
                      <div className="border-2 border-purple-200 rounded-xl p-4 bg-white shadow">
                        <div className="font-semibold text-purple-950">
                          Part Size:{" "}
                          <span className="font-medium">
                            {partsDetails.sizes.map((part, idx) => (
                              <span key={idx}>{part.size},</span>
                            ))}
                          </span>
                        </div>
                        <div className="mt-2 font-semibold text-purple-950">
                          Ratio Component:{" "}
                          <span className="font-medium">
                            {partsDetails.sizes.map((part, idx) => (
                              <span key={idx}>{part.ratio_component}:</span>
                            ))}
                          </span>
                        </div>
                      </div>
                      {/* ))} */}
                    </div>
                  </div>
                )}
                {partsDetails.variants?.length > 0 && (
                  <div className="max-h-[500px] overflow-y-auto">
                    <h3 className="text-lg font-bold text-purple-950 mb-2">
                      Variants
                    </h3>
                    <div className="space-y-4">
                      {partsDetails.variants.map((part, idx) => (
                        <div
                          key={idx}
                          className="border-2 border-purple-200 rounded-xl p-4 bg-white shadow"
                        >
                          <div className="font-semibold text-purple-950 mb-2">
                            Variant:{" "}
                            <span className="font-bold ">{part.variation}</span>
                          </div>
                          <div className="font-bold text-purple-950 mb-2">
                            Part Variant:{" "}
                            <span className="font-medium ">
                              {part.part_name || part.name || part.part_id}
                            </span>
                          </div>
                          {part.fabrics && (
                            <div className="">
                              <div className="font-bold text-purple-950 mb-1">
                                Fabrics:
                              </div>
                              <div className="space-y-2">
                                {part.fabrics.map((fab, fi) => (
                                  <div
                                    key={fi}
                                    className="border border-purple-100 rounded-lg p-3 bg-gradient-to-br from-gray-50 to-white"
                                  >
                                    <div className="font-bold text-purple-950 mb-1">
                                      Fabric Type:{" "}
                                      <span className="font-medium">
                                        {fab.fabric_type_name ||
                                          fab.fabric_type_id}
                                      </span>
                                    </div>
                                    {fab.colors && (
                                      <div className="ml-2">
                                        <div className="font-bold text-purple-950 mb-1">
                                          Fabric Colors:
                                        </div>
                                        <div className="space-y-1">
                                          <table className="w-full rounded-lg overflow-hidden">
                                            <thead>
                                              <tr className="text-left text-white border-b border-purple-200 bg-gradient-to-br from-purple-600 to-blue-400">
                                                <th className="px-6 py-1">
                                                  Name
                                                </th>
                                                <th className="px-6 py-1">
                                                  Base
                                                </th>
                                                <th className="px-6 py-1">
                                                  Consumption
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {fab.colors.map((col, ci) => (
                                                <tr
                                                  key={ci}
                                                  className="text-left text-purple-700 border-b border-purple-200"
                                                >
                                                  <td className="px-6 py-1">
                                                    {col.color_name || col.name}
                                                  </td>
                                                  <td className="px-6 py-1">
                                                    {col.is_base ? "Yes" : "No"}
                                                  </td>
                                                  <td className="px-6 py-1">
                                                    {col.consumption}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                console.log({ sizes, variants: autoVariants });
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
              className="space-y-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="mb-4">
                <label className="block font-bold text-xl mb-1 text-purple-950">
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
                <label className="block font-bold text-xl text-purple-950 mb-2">
                  Variants
                </label>
                <div className="space-y-6">
                  {variants.map((v, vi) => (
                    <div
                      key={vi}
                      className="rounded-2xl border-2 border-purple-200 bg-gray-50 p-4 shadow flex flex-col gap-2"
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
                                        // Set all colors in all fabrics of this variant to is_base: false except the selected one
                                        newVariants[vi].fabrics.forEach(
                                          (fabric, fabricIdx) => {
                                            fabric.colors = fabric.colors.map(
                                              (color, colorIdx) => ({
                                                ...color,
                                                is_base:
                                                  fabricIdx === fi &&
                                                  colorIdx === ci
                                                    ? e.target.checked
                                                    : false,
                                              })
                                            );
                                          }
                                        );
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
