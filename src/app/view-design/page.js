"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/utils/supabaseClient";
import { API } from "@/utils/url";
import { Upload } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function ViewDesign() {
  const [viewPartsModal, setViewPartsModal] = useState({
    open: false,
    designId: null,
  });
  const [partsDetails, setPartsDetails] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [fabricTypeOptions, setFabricTypeOptions] = useState([]);
  const [partOptions, setPartOptions] = useState([]);
  const [uploadModal, setUploadModal] = useState({
    open: false,
    designId: null,
  });
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
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
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
        console.log(res.data.data.designs);

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
        <h1 className="text-3xl font-bold mb-6 text-blue-900">
          Grouped Designs
        </h1>
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
                  className="p-6 rounded-xl shadow bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
                >
                  <div className="mb-2 text-lg font-semibold text-blue-800">
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                      onClick={() => {
                        if (expandedDesigns.includes(idx)) {
                          setExpandedDesigns(
                            expandedDesigns.filter((i) => i !== idx)
                          );
                        } else {
                          setExpandedDesigns([...expandedDesigns, idx]);
                        }
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
                          className="absolute top-4 right-4 text-gray-400 hover:text-blue-700 text-2xl font-bold"
                          onClick={() =>
                            setExpandedDesigns(
                              expandedDesigns.filter((i) => i !== idx)
                            )
                          }
                        >
                          &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-blue-900">
                          Designs in this group
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {group.map((d) => (
                            <div
                              key={d.design_id}
                              className="rounded-xl shadow p-6 flex flex-col items-center bg-gradient-to-br from-blue-100 to-blue-50"
                            >
                              <img
                                src={d.image_url || "/default-design.png"}
                                alt={d.design_name}
                                className="w-28 h-28 object-cover rounded-xl mb-3 border-2 border-blue-200"
                              />
                              <div className="font-bold text-xl mb-2 text-blue-900">
                                {d.design_name}
                              </div>
                              <div className="mb-1">
                                Status:{" "}
                                <span className="font-medium text-blue-700">
                                  {d.status}
                                </span>
                              </div>
                              <div className="mb-1">
                                PO:{" "}
                                <span className="font-medium text-blue-700">
                                  {d.po}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button
                                  className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
                                  onClick={async () => {
                                    try {
                                      const res = await axios.get(
                                        `${API}so/design/${d.design_id}/parts`,
                                        {
                                          headers: {
                                            Authorization: `Bearer ${accessToken}`,
                                            "Organization-ID": organizationId,
                                          },
                                        }
                                      );
                                      setPartsDetails(res.data || {});
                                      setViewPartsModal({
                                        open: true,
                                        designId: d.design_id,
                                      });
                                    } catch (err) {
                                      setPartsDetails([]);
                                      setViewPartsModal({
                                        open: true,
                                        designId: d.design_id,
                                      });
                                    }
                                  }}
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
                                <button
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition"
                                  onClick={() =>
                                    handleViewFabricRequirements(d.design_id)
                                  }
                                >
                                  View Fabric Requirements
                                </button>
                              </div>
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
                                    <h2 className="text-lg font-semibold mb-4">
                                      Parts Details
                                    </h2>
                                    {!partsDetails ? (
                                      <div className="text-gray-500">
                                        No parts found for this design.
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {partsDetails.sizes?.map(
                                          (part, idx) => (
                                            <div
                                              key={idx}
                                              className="border rounded p-3 bg-gray-50"
                                            >
                                              <div className="font-semibold">
                                                Part Size: {part.size}
                                              </div>
                                              <div className="ml-2">
                                                <div className="font-medium">
                                                  Ratio Component :{" "}
                                                  {part.ratio_component}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                        {partsDetails.variants?.map(
                                          (part, idx) => (
                                            <div
                                              key={idx}
                                              className="border rounded p-3 bg-gray-50"
                                            >
                                              <div className="font-semibold">
                                                Part Variants:{" "}
                                                {part.part_name ||
                                                  part.name ||
                                                  part.part_id}
                                              </div>
                                              {part.fabrics && (
                                                <div className="ml-2">
                                                  <div className="font-medium">
                                                    Fabrics:
                                                  </div>
                                                  {part.fabrics.map(
                                                    (fab, fi) => (
                                                      <div
                                                        key={fi}
                                                        className="ml-2"
                                                      >
                                                        <div>
                                                          Type:{" "}
                                                          {fab.fabric_type_name ||
                                                            fab.fabric_type_id}
                                                        </div>
                                                        {fab.colors && (
                                                          <div className="ml-2">
                                                            <div className="font-medium">
                                                              Colors:
                                                            </div>
                                                            {fab.colors.map(
                                                              (col, ci) => (
                                                                <div
                                                                  key={ci}
                                                                  className="ml-2 flex gap-2"
                                                                >
                                                                  <div>
                                                                    ID:{" "}
                                                                    {
                                                                      col.color_id
                                                                    }
                                                                  </div>
                                                                  <div>
                                                                    Name:{" "}
                                                                    {col.color_name ||
                                                                      col.name}
                                                                  </div>
                                                                  <div>
                                                                    Base:{" "}
                                                                    {col.is_base
                                                                      ? "Yes"
                                                                      : "No"}
                                                                  </div>
                                                                  <div>
                                                                    Consumption:{" "}
                                                                    {
                                                                      col.consumption
                                                                    }
                                                                  </div>
                                                                </div>
                                                              )
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* Upload Modal */}
                              {uploadModal.open && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full relative">
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
                                    <h2 className="text-lg font-semibold mb-4">
                                      Upload Design Data
                                    </h2>
                                    {uploadError && (
                                      <div className="text-red-600 mb-2">
                                        {uploadError}
                                      </div>
                                    )}
                                    {uploadSuccess && (
                                      <div className="text-green-600 mb-2">
                                        {uploadSuccess}
                                      </div>
                                    )}
                                    <form
                                      onSubmit={async (e) => {
                                        e.preventDefault();
                                        setUploadLoading(true);
                                        setUploadError("");
                                        setUploadSuccess("");
                                        try {
                                          await axios.post(
                                            `${API}so/update-data/${uploadModal.designId}`,
                                            { sizes, variants },
                                            {
                                              headers: {
                                                Authorization: `Bearer ${accessToken}`,
                                                "Organization-ID":
                                                  organizationId,
                                              },
                                            }
                                          );
                                          setUploadSuccess(
                                            "Design data uploaded successfully!"
                                          );
                                          setUploadModal({
                                            open: false,
                                            designId: null,
                                          });
                                        } catch (err) {
                                          setUploadError(
                                            "Failed to upload design data."
                                          );
                                        } finally {
                                          setUploadLoading(false);
                                        }
                                      }}
                                    >
                                      <div className="mb-4">
                                        <label className="block font-medium mb-1">
                                          Sizes
                                        </label>
                                        {sizes.map((sz, i) => (
                                          <div
                                            key={i}
                                            className="flex gap-2 mb-2"
                                          >
                                            <input
                                              type="text"
                                              placeholder="Size"
                                              className="border px-2 py-1 rounded w-20"
                                              value={sz.size}
                                              onChange={(e) => {
                                                const newSizes = [...sizes];
                                                newSizes[i].size =
                                                  e.target.value;
                                                setSizes(newSizes);
                                              }}
                                            />
                                            <input
                                              type="number"
                                              placeholder="Ratio Component"
                                              className="border px-2 py-1 rounded w-32"
                                              value={sz.ratio_component}
                                              onChange={(e) => {
                                                const newSizes = [...sizes];
                                                newSizes[i].ratio_component =
                                                  e.target.value;
                                                setSizes(newSizes);
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="text-red-500"
                                              onClick={() =>
                                                setSizes(
                                                  sizes.filter(
                                                    (_, idx) => idx !== i
                                                  )
                                                )
                                              }
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          className="text-blue-600 underline"
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
                                          Add Size
                                        </button>
                                      </div>
                                      <div className="mb-4">
                                        <label className="block font-medium mb-1">
                                          Variants
                                        </label>
                                        {variants.map((v, vi) => (
                                          <div
                                            key={vi}
                                            className="border rounded p-2 mb-2"
                                          >
                                            <input
                                              type="text"
                                              placeholder="Variation"
                                              className="border px-2 py-1 rounded w-24 mr-2"
                                              value={v.variation}
                                              onChange={(e) => {
                                                const newVariants = [
                                                  ...variants,
                                                ];
                                                newVariants[vi].variation =
                                                  e.target.value;
                                                setVariants(newVariants);
                                              }}
                                            />
                                            <select
                                              className="border px-2 py-1 rounded w-32 mr-2"
                                              value={v.part_id}
                                              onChange={(e) => {
                                                const newVariants = [
                                                  ...variants,
                                                ];
                                                newVariants[vi].part_id =
                                                  e.target.value;
                                                setVariants(newVariants);
                                              }}
                                            >
                                              <option value="">
                                                Select Part
                                              </option>
                                              {partOptions.map((p) => (
                                                <option
                                                  key={p.id || p.part_id}
                                                  value={p.id || p.part_id}
                                                >
                                                  {p.name || p.part_name}
                                                </option>
                                              ))}
                                            </select>
                                            {/* Fabrics */}
                                            {v.fabrics.map((f, fi) => (
                                              <div
                                                key={fi}
                                                className="ml-4 mb-2"
                                              >
                                                <select
                                                  className="border px-2 py-1 rounded w-32 mr-2"
                                                  value={f.fabric_type_id}
                                                  onChange={(e) => {
                                                    const newVariants = [
                                                      ...variants,
                                                    ];
                                                    newVariants[vi].fabrics[
                                                      fi
                                                    ].fabric_type_id =
                                                      e.target.value;
                                                    setVariants(newVariants);
                                                  }}
                                                >
                                                  <option value="">
                                                    Select Fabric Type
                                                  </option>
                                                  {fabricTypeOptions.map(
                                                    (ft) => (
                                                      <option
                                                        key={
                                                          ft.id ||
                                                          ft.fabric_type_id
                                                        }
                                                        value={
                                                          ft.id ||
                                                          ft.fabric_type_id
                                                        }
                                                      >
                                                        {ft.name ||
                                                          ft.fabric_type_name}
                                                      </option>
                                                    )
                                                  )}
                                                </select>
                                                {/* Colors */}
                                                {f.colors.map((c, ci) => (
                                                  <div
                                                    key={ci}
                                                    className="ml-4 flex gap-2 mb-1"
                                                  >
                                                    <select
                                                      className="border px-2 py-1 rounded w-32"
                                                      value={c.color_id}
                                                      onChange={(e) => {
                                                        const newVariants = [
                                                          ...variants,
                                                        ];
                                                        newVariants[vi].fabrics[
                                                          fi
                                                        ].colors[ci].color_id =
                                                          e.target.value;
                                                        setVariants(
                                                          newVariants
                                                        );
                                                      }}
                                                    >
                                                      <option value="">
                                                        Select Color
                                                      </option>
                                                      {colorOptions.map(
                                                        (col) => (
                                                          <option
                                                            key={
                                                              col.id ||
                                                              col.color_id
                                                            }
                                                            value={
                                                              col.id ||
                                                              col.color_id
                                                            }
                                                          >
                                                            {col.name ||
                                                              col.color_name}
                                                          </option>
                                                        )
                                                      )}
                                                    </select>
                                                    <label className="flex items-center gap-1">
                                                      <input
                                                        type="checkbox"
                                                        checked={!!c.is_base}
                                                        onChange={(e) => {
                                                          const newVariants = [
                                                            ...variants,
                                                          ];
                                                          newVariants[
                                                            vi
                                                          ].fabrics[fi].colors[
                                                            ci
                                                          ].is_base =
                                                            e.target.checked;
                                                          setVariants(
                                                            newVariants
                                                          );
                                                        }}
                                                      />
                                                      Base
                                                    </label>
                                                    <input
                                                      type="number"
                                                      placeholder="Consumption"
                                                      className="border px-2 py-1 rounded w-24"
                                                      value={c.consumption}
                                                      onChange={(e) => {
                                                        const newVariants = [
                                                          ...variants,
                                                        ];
                                                        newVariants[vi].fabrics[
                                                          fi
                                                        ].colors[
                                                          ci
                                                        ].consumption =
                                                          e.target.value;
                                                        setVariants(
                                                          newVariants
                                                        );
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      className="text-red-500"
                                                      onClick={() => {
                                                        const newVariants = [
                                                          ...variants,
                                                        ];
                                                        newVariants[vi].fabrics[
                                                          fi
                                                        ].colors = newVariants[
                                                          vi
                                                        ].fabrics[
                                                          fi
                                                        ].colors.filter(
                                                          (_, idx) => idx !== ci
                                                        );
                                                        setVariants(
                                                          newVariants
                                                        );
                                                      }}
                                                    >
                                                      Remove Color
                                                    </button>
                                                  </div>
                                                ))}
                                                <button
                                                  type="button"
                                                  className="text-blue-600 underline"
                                                  onClick={() => {
                                                    const newVariants = [
                                                      ...variants,
                                                    ];
                                                    newVariants[vi].fabrics[
                                                      fi
                                                    ].colors.push({
                                                      color_id: "",
                                                      is_base: false,
                                                      consumption: "",
                                                    });
                                                    setVariants(newVariants);
                                                  }}
                                                >
                                                  Add Color
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              className="text-blue-600 underline ml-4"
                                              onClick={() => {
                                                const newVariants = [
                                                  ...variants,
                                                ];
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
                                              Add Fabric
                                            </button>
                                            <button
                                              type="button"
                                              className="text-red-500 ml-2"
                                              onClick={() =>
                                                setVariants(
                                                  variants.filter(
                                                    (_, idx) => idx !== vi
                                                  )
                                                )
                                              }
                                            >
                                              Remove Variant
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          className="text-blue-600 underline"
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
                                          Add Variant
                                        </button>
                                      </div>
                                      <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded"
                                        disabled={uploadLoading}
                                      >
                                        {uploadLoading
                                          ? "Uploading..."
                                          : "Submit"}
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              )}
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
      </div>
    </div>
  );
}
