"use client";
import Sidebar from "@/components/Sidebar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios, { all } from "axios";
import { API } from "@/utils/url";
import { supabase } from "@/utils/supabaseClient";
import {
  Delete,
  DeleteIcon,
  Eye,
  Plus,
  Trash,
  Upload,
  PackagePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CreateDesignForm from "@/components/CreateDesignForm";

export default function GroupDesignsPage() {
  const searchParams = useSearchParams();
  const groupId = decodeURIComponent(searchParams.get("groupId"));
  const [designs, setDesigns] = useState({});
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
  const [accessoriesModal, setAccessoriesModal] = useState({
    open: false,
    designId: null,
  });
  const [viewAccessoriesModal, setViewAccessoriesModal] = useState({
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
  const [sizes, setSizes] = useState([{ size: "", ratio_component: 1 }]);
  const [variantGroups, setVariantGroups] = useState([
    {
      variation: "",
      parts: [
        {
          part_id: "",
          fabrics: [
            {
              fabric_type_id: "",
              dia: 0.0,
              gsm: 0,
              colors: [
                {
                  color_id: "",
                  is_base: false,
                  consumption: 0.0,
                  rate_info: {
                    rate: 0.0,
                    unit_id: 1,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
  const [createDesignModal, setCreateDesignModal] = useState(false);
  const [defaultDesignFields, setDefaultDesignFields] = useState(null);
  const router = useRouter();
  const [groupCreated, setGroupCreated] = useState(false);
  const [designCreated, setDesignCreated] = useState(false);
  const [accessories, setAccessories] = useState([
    {
      accessory_id: "1",
      brand_id: "1",
      color_id: "",
      size_id: "1",
      unit_id: "1",
      rate_per_unit: "0",
      required_qty: "0",
      remarks: "",
    },
  ]);
  const [accessoryOptions, setAccessoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [colorAccessoryOptions, setColorAccessoryOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [accessoriesLoading, setAccessoriesLoading] = useState(false);
  const [accessoriesError, setAccessoriesError] = useState("");
  const [accessoriesSuccess, setAccessoriesSuccess] = useState("");
  const [existingAccessories, setExistingAccessories] = useState([]);
  const [viewAccessoriesLoading, setViewAccessoriesLoading] = useState(false);
  const [viewAccessoriesError, setViewAccessoriesError] = useState("");
  const [viewAccessories, setViewAccessories] = useState([]);

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
    if (accessToken && organizationId && groupId) {
      async function fetchDesignsInGroup(groupId) {
        try {
          const { data } = await axios.get(
            `${API}design/merchant/groups/${groupId}/designs`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }
          );
          // console.log(data, " designs in group");

          setDesigns(data.data || {});
        } catch (err) {
          setError("Failed to fetch design details.");
        }
      }

      // Fetch designs from localStorage for this group
      if (typeof window !== "undefined") {
        setLoading(true);
        fetchDesignsInGroup(localStorage.getItem("group_id"));
        setLoading(false);
      }
    }
  }, [accessToken, organizationId, groupId, designCreated]);

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

  // Fetch dropdown options for accessories modal and existing accessories
  useEffect(() => {
    if (accessoriesModal.open) {
      const fetchAccessoryDropdowns = async () => {
        try {
          const [
            accessoryRes,
            brandRes,
            colorRes,
            sizeRes,
            // unitRes
          ] = await Promise.all([
            axios.get(`${API}so/accessory-suggestions`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
            axios.get(`${API}so/brand-suggestions`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
            axios.get(`${API}so/color-suggestions`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
            axios.get(`${API}so/size-suggestions`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Organization-ID": organizationId,
              },
            }),
            // axios.get(`${API}so/unit-suggestions`, {
            //   headers: {
            //     Authorization: `Bearer ${accessToken}`,
            //     "Organization-ID": organizationId,
            //   },
            // }),
          ]);
          setAccessoryOptions(accessoryRes.data?.data || []);
          setBrandOptions(brandRes.data?.data || []);
          setColorAccessoryOptions(colorRes.data?.data || []);
          setSizeOptions(sizeRes.data?.data || []);
          // setUnitOptions(unitRes.data?.data || []);
        } catch (err) {
          setAccessoryOptions([]);
          setBrandOptions([]);
          setColorAccessoryOptions([]);
          setSizeOptions([]);
          setUnitOptions([]);
        }
      };

      // const fetchExistingAccessories = async () => {
      //   try {
      //     const res = await axios.get(
      //       `${API}so/view-accessories/${accessoriesModal.designId}`,
      //       {
      //         headers: {
      //           Authorization: `Bearer ${accessToken}`,
      //           "Organization-ID": organizationId,
      //         },
      //       }
      //     );
      //     setExistingAccessories(res.data?.accessories || []);
      //   } catch (err) {
      //     setExistingAccessories([]);
      //   }
      // };

      fetchAccessoryDropdowns();
      // fetchExistingAccessories();
    }
  }, [
    accessoriesModal.open,
    accessToken,
    organizationId,
    accessoriesModal.designId,
  ]);

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

  let groupedEntries = designs?.designs;
  // console.log(groupedEntries, "grouped entries");

  // Initial sort by created_at descending
  if (groupedEntries && Array.isArray(groupedEntries)) {
    groupedEntries = groupedEntries.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
  }
  // Extract common group fields from first design
  const groupInfo =
    designs?.designs?.length > 0
      ? {
          party: designs?.group_summary?.party,
          order_quantity: designs?.group_summary?.total_quantity,
          design_type: designs?.group_summary?.design_type,
          mrp: designs?.group_summary?.mrp,
          rate: designs?.group_summary?.rate,
          delivery_date: formatToIST(designs?.designs?.[0]?.delivery_date),
        }
      : {};

  const handleViewParts = async (designId) => {
    setViewPartsModal({ open: true, designId });
    try {
      const res = await axios.get(`${API}so/design/${designId}/parts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      // console.log(res.data, " parts data");

      setPartsDetails(res.data || {});

      setSizes(res.data.sizes || sizes);
      setVariantGroups(res.data.variants || variantGroups);
    } catch (err) {
      setPartsDetails([]);
      setViewPartsModal({ open: true, designId });
    }
  };

  const handleOpenUploadModal = (designId) => {
    setUploadModal({ open: true, designId });
    handleViewParts(designId);
  };

  const handleOpenAccessoriesModal = (designId) => {
    setAccessoriesModal({ open: true, designId });
    // setAccessories([
    //   {
    //     accessory_id: "",
    //     brand_id: "",
    //     color_id: "",
    //     size_id: "",
    //     unit_id: "",
    //     rate_per_unit: "",
    //     required_qty: "",
    //     remarks: "",
    //   },
    // ]);
    setAccessoriesError("");
    setAccessoriesSuccess("");
  };

  const handleOpenViewAccessoriesModal = async (designId) => {
    setViewAccessoriesModal({ open: true, designId });
    setViewAccessoriesLoading(true);
    setViewAccessoriesError("");
    try {
      const res = await axios.get(`${API}so/view-accessories/${designId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      setViewAccessories(res.data?.data?.accessories || []);
    } catch (err) {
      setViewAccessories([]);
      setViewAccessoriesError("Failed to fetch accessories.");
    } finally {
      setViewAccessoriesLoading(false);
    }
  };

  const handleViewFabricRequirementsNav = () => {
    // if (typeof window !== "undefined") {
    //   localStorage.setItem("fabric_requirements_design_id", String(designId));
    // }
    router.push("/view-design/fabric-requirements");
  };

  const handleOpenCreateDesign = () => {
    // Get common fields from the first design in the group

    setCreateDesignModal(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-3xl font-bold text-blue-950">Designs in Group</h1>
          <div className="flex gap-4">
            <button
              className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => router.push("/view-design/view-po")}
            >
              <Eye size={20} />
              View PO
            </button>
            <button
              className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => handleViewFabricRequirementsNav()}
            >
              <Eye size={20} />
              Fabric Requirements
            </button>
            <button
              className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => router.push("/view-design/trims-requirements")}
            >
              <Eye size={20} />
              Trims Requirements
            </button>
            <button
              className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition font-semibold flex items-center gap-2"
              onClick={handleOpenCreateDesign}
            >
              <Plus size={20} />
              Create Design
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-gray-500">
            <div className="border-y-2 rounded-full w-16 h-16 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : designs?.designs?.length === 0 ? (
          <div className="p-4 text-gray-500">
            No designs found in this group.
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-semibold text-blue-950">Party:</span>{" "}
                  <span className="font-bold">{groupInfo.party}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-950">
                    Order Quantity:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.order_quantity}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-950">
                    Design Type:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.design_type}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-950">MRP:</span>{" "}
                  <span className="font-bold">{groupInfo.mrp}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-950">Rate:</span>{" "}
                  <span className="font-bold">{groupInfo.rate}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-950">
                    Delivery Date:
                  </span>{" "}
                  <span className="font-bold">{groupInfo.delivery_date}</span>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-blue-200">
              <table className="min-w-full bg-white  rounded-xl  shadow">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-blue-950 font-bold">
                      Image
                    </th>
                    <th className="px-4 py-2 text-left text-blue-950 font-bold">
                      Design Name
                    </th>
                    <th className="px-4 py-2 text-left text-blue-950 font-bold">
                      Status
                    </th>
                    {/* <th className="px-4 py-2 text-left text-blue-950 font-bold">
                      PO
                    </th> */}
                    <th className="px-4 py-2 text-left text-blue-950 font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedEntries?.map((d) => (
                    <tr
                      key={d.design_id}
                      className="border-b border-gray-100 hover:bg-blue-50"
                    >
                      <td className="px-4 py-2">
                        <img
                          src={d?.image?.url || "/default-design.png"}
                          alt={d.design_name}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-blue-200"
                        />
                      </td>
                      <td className="px-4 py-2 font-semibold text-blue-950">
                        {d.design_name}
                      </td>
                      <td className="px-4 py-2 text-blue-700">{d.status}</td>
                      {/* <td className="px-4 py-2 text-blue-700">{d.po}</td> */}
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-foreground transition flex items-center gap-2"
                            onClick={() => handleViewParts(d.design_id)}
                          >
                            <Eye size={16} />
                            View Parts
                          </button>
                          <button
                            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition flex items-center gap-2"
                            onClick={() => handleOpenUploadModal(d.design_id)}
                          >
                            <Upload size={16} />
                            Upload Parts
                          </button>
                          <button
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition flex items-center gap-2"
                            onClick={() =>
                              handleOpenAccessoriesModal(d.design_id)
                            }
                          >
                            <PackagePlus size={16} />
                            Upload Trims
                          </button>
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
                            onClick={() =>
                              handleOpenViewAccessoriesModal(d.design_id)
                            }
                          >
                            <Eye size={16} />
                            View Trims
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
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-700 text-2xl font-bold"
              onClick={() =>
                setViewPartsModal({
                  open: false,
                  designId: null,
                })
              }
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-950">
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
                    <h3 className="text-lg font-bold text-blue-950 mb-2">
                      Sizes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* {partsDetails.sizes.map((part, idx) => ( */}
                      <div className="border-2 border-blue-200 rounded-xl p-4 bg-white shadow">
                        <div className="font-semibold text-blue-950">
                          Part Size:{" "}
                          <span className="font-medium">
                            {partsDetails.sizes.map((part, idx) => (
                              <span key={idx}>{part.size},</span>
                            ))}
                          </span>
                        </div>
                        <div className="mt-2 font-semibold text-blue-950">
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
                    <h3 className="text-lg font-bold text-blue-950 mb-2">
                      Variants
                    </h3>
                    <div className="space-y-4">
                      {partsDetails.variants.map((part, idx) => (
                        <div
                          key={idx}
                          className="border-2 border-blue-200 rounded-xl p-4 bg-white shadow"
                        >
                          <div className="font-semibold text-blue-950 mb-2">
                            Variant:{" "}
                            <span className="font-bold ">{part.variation}</span>
                          </div>

                          {part.parts.map((p, pi) => (
                            <div key={pi} className="ml-2 mb-2">
                              <div className="font-bold text-blue-950 mb-2">
                                Part Variant:{" "}
                                <span className="font-medium ">
                                  {p.part_name || p.name || p.part_id}
                                </span>
                              </div>
                              {p.fabrics && (
                                <div className="ml-4">
                                  <div className="font-bold text-blue-950 mb-1">
                                    Fabrics:
                                  </div>
                                  <div className="space-y-2">
                                    {p.fabrics.map((fab, fi) => (
                                      <div
                                        key={fi}
                                        className="border border-blue-100 rounded-lg p-3 bg-gradient-to-br from-gray-50 to-white"
                                      >
                                        <div className="font-bold text-blue-950 mb-1">
                                          Fabric Type:{" "}
                                          <span className="font-medium">
                                            {fab.fabric_type_name ||
                                              fab.fabric_type_id}
                                          </span>
                                        </div>
                                        <div className="font-bold text-blue-950 mb-1">
                                          DIA:{" "}
                                          <span className="font-medium">
                                            {fab.dia || "N/A"}
                                          </span>
                                        </div>
                                        <div className="font-bold text-blue-950 mb-1">
                                          GSM:{" "}
                                          <span className="font-medium">
                                            {fab.gsm || "N/A"}
                                          </span>
                                        </div>
                                        {fab.colors && (
                                          <div className="ml-2">
                                            <div className="font-bold text-blue-950 mb-1">
                                              Fabric Colors:
                                            </div>
                                            <div className="space-y-1">
                                              <table className="w-full rounded-lg overflow-hidden">
                                                <thead>
                                                  <tr className="text-left text-white border-b border-blue-200 bg-foreground">
                                                    <th className="px-6 py-1">
                                                      Name
                                                    </th>
                                                    <th className="px-6 py-1">
                                                      Base
                                                    </th>
                                                    <th className="px-6 py-1">
                                                      Consumption
                                                    </th>
                                                    <th className="px-6 py-1">
                                                      Rate
                                                    </th>
                                                    <th className="px-6 py-1">
                                                      Unit
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {fab.colors.map((col, ci) => (
                                                    <tr
                                                      key={ci}
                                                      className="text-left text-blue-700 border-b border-blue-200"
                                                    >
                                                      <td className="px-6 py-1">
                                                        {col.color_name ||
                                                          col.name}
                                                      </td>
                                                      <td className="px-6 py-1">
                                                        {col.is_base
                                                          ? "Yes"
                                                          : "No"}
                                                      </td>
                                                      <td className="px-6 py-1">
                                                        {col.consumption}
                                                      </td>
                                                      <td className="px-6 py-1">
                                                        {col.rate_info?.rate ??
                                                          "-"}
                                                      </td>
                                                      <td className="px-6 py-1">
                                                        {unitOptions.find(
                                                          (u) =>
                                                            (u.id ||
                                                              u.unit_id) ===
                                                            col.rate_info
                                                              ?.unit_id
                                                        )?.name ||
                                                          unitOptions.find(
                                                            (u) =>
                                                              (u.id ||
                                                                u.unit_id) ===
                                                              col.rate_info
                                                                ?.unit_id
                                                          )?.unit_name ||
                                                          col.rate_info
                                                            ?.unit_id ||
                                                          "-"}
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
                const autoVariants = variantGroups.map((v, idx) => ({
                  ...v,
                  variation: String(idx + 1),
                }));
                // console.log(sizes, variants, "sizes, variants");
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
                  setViewPartsModal({
                    open: false,
                    designId: uploadModal.designId,
                  });
                }
              }}
              className="space-y-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="mb-4">
                <label className="block font-bold text-xl mb-1 text-blue-950">
                  Sizes
                </label>
                {sizes.map((sz, i) => (
                  <div key={i} className="flex gap-2 mb-2 ml-1">
                    <input
                      type="text"
                      placeholder="Size"
                      className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-24"
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
                      className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white "
                      value={sz.ratio_component}
                      min="0"
                      onInput={(e) => {
                        if (e.target.value < 0) e.target.value = 0;
                      }}
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
                  className="text-blue-600  font-semibold"
                  onClick={() =>
                    setSizes([
                      ...sizes,
                      {
                        size: "",
                        ratio_component: 1,
                      },
                    ])
                  }
                >
                  <Plus className="inline-block mr-1" />
                  Add Size
                </button>
              </div>
              <div className="mb-4 ">
                <label className="block font-bold text-xl text-blue-950 mb-2">
                  Variants
                </label>
                <div className="space-y-6">
                  {variantGroups.map((vg, vgi) => (
                    <div
                      key={vgi}
                      className="rounded-2xl border-2 border-blue-200 bg-gray-50 p-4 shadow flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-700 font-bold text-lg">
                          Variant #{vgi + 1}
                        </span>
                        <button
                          type="button"
                          className="text-red-500 font-semibold px-3 py-1 rounded hover:bg-red-50"
                          onClick={() =>
                            setVariantGroups(
                              variantGroups.filter((_, idx) => idx !== vgi)
                            )
                          }
                        >
                          <Trash className="inline-block mr-1" />
                          Remove Variant
                        </button>
                      </div>
                      {/* Parts under this variant */}
                      {vg.parts.map((part, pi) => (
                        <div
                          key={pi}
                          className="border border-blue-300 rounded-xl p-4 mb-4 bg-white"
                        >
                          <div className="flex flex-wrap gap-4 items-center mb-2">
                            <div className="flex flex-col">
                              <label className="text-blue-700 font-medium mb-1">
                                Part
                              </label>
                              <select
                                className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[150px]"
                                value={part.part_id}
                                onChange={(e) => {
                                  const newGroups = [...variantGroups];
                                  newGroups[vgi].parts[pi].part_id =
                                    e.target.value;
                                  setVariantGroups(newGroups);
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
                            <button
                              type="button"
                              className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                              onClick={() => {
                                const newGroups = [...variantGroups];
                                newGroups[vgi].parts = newGroups[
                                  vgi
                                ].parts.filter((_, idx) => idx !== pi);
                                setVariantGroups(newGroups);
                              }}
                            >
                              <Trash className="inline-block mr-1" />
                              Remove Part
                            </button>
                          </div>
                          {/* Fabrics for this part */}
                          <div className="flex flex-col gap-4">
                            {part.fabrics.map((f, fi) => (
                              <div
                                key={fi}
                                className="rounded-xl border border-blue-100 bg-white p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-blue-700 font-medium">
                                    Fabric #{fi + 1}
                                  </span>
                                  <button
                                    type="button"
                                    className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                    onClick={() => {
                                      const newGroups = [...variantGroups];
                                      newGroups[vgi].parts[pi].fabrics =
                                        newGroups[vgi].parts[pi].fabrics.filter(
                                          (_, idx) => idx !== fi
                                        );
                                      setVariantGroups(newGroups);
                                    }}
                                  >
                                    <Trash className="inline-block mr-1" />
                                    Remove Fabric
                                  </button>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
                                  <div className="flex flex-col">
                                    <label className="text-blue-700 font-medium mb-1">
                                      Fabric Type
                                    </label>
                                    <select
                                      className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[150px]"
                                      value={f.fabric_type_id}
                                      onChange={(e) => {
                                        const newGroups = [...variantGroups];
                                        newGroups[vgi].parts[pi].fabrics[
                                          fi
                                        ].fabric_type_id = e.target.value;
                                        setVariantGroups(newGroups);
                                      }}
                                    >
                                      <option value="">
                                        Select Fabric Type
                                      </option>
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
                                      placeholder="GSM"
                                      className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[100px]"
                                      value={f.gsm || ""}
                                      min="0"
                                      onInput={(e) => {
                                        if (e.target.value < 0)
                                          e.target.value = 0;
                                      }}
                                      onChange={(e) => {
                                        const newGroups = [...variantGroups];
                                        newGroups[vgi].parts[pi].fabrics[
                                          fi
                                        ].gsm = e.target.value;
                                        setVariantGroups(newGroups);
                                      }}
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <label className="text-blue-700 font-medium mb-1">
                                      DIA
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="DIA"
                                      className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[100px]"
                                      value={f.dia || ""}
                                      min="0"
                                      onInput={(e) => {
                                        if (e.target.value < 0)
                                          e.target.value = 0;
                                      }}
                                      onChange={(e) => {
                                        const newGroups = [...variantGroups];
                                        newGroups[vgi].parts[pi].fabrics[
                                          fi
                                        ].dia = parseFloat(e.target.value) || 0;
                                        setVariantGroups(newGroups);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 mt-2">
                                  <label className="text-blue-700 font-medium mb-1">
                                    Colors
                                  </label>
                                  {f.colors.map((c, ci) => (
                                    <div
                                      key={ci}
                                      className="flex flex-wrap gap-2 items-center mb-1"
                                    >
                                      <select
                                        className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[120px]"
                                        value={c.color_id}
                                        onChange={(e) => {
                                          const newGroups = [...variantGroups];
                                          newGroups[vgi].parts[pi].fabrics[
                                            fi
                                          ].colors[ci].color_id =
                                            e.target.value;
                                          setVariantGroups(newGroups);
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
                                            const newGroups = [
                                              ...variantGroups,
                                            ];
                                            // Only one base color among all parts/fabrics in this variant group
                                            newGroups[vgi].parts.forEach(
                                              (partObj) => {
                                                partObj.fabrics.forEach(
                                                  (fabricObj) => {
                                                    fabricObj.colors =
                                                      fabricObj.colors.map(
                                                        (colorObj) => ({
                                                          ...colorObj,
                                                          is_base: false,
                                                        })
                                                      );
                                                  }
                                                );
                                              }
                                            );
                                            newGroups[vgi].parts[pi].fabrics[
                                              fi
                                            ].colors[ci].is_base =
                                              e.target.checked;
                                            setVariantGroups(newGroups);
                                          }}
                                        />
                                        <span className="text-blue-700">
                                          Base
                                        </span>
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Consumption"
                                        className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-50"
                                        value={c.consumption}
                                        min="0"
                                        onInput={(e) => {
                                          if (e.target.value < 0)
                                            e.target.value = 0;
                                        }}
                                        onChange={(e) => {
                                          const newGroups = [...variantGroups];
                                          newGroups[vgi].parts[pi].fabrics[
                                            fi
                                          ].colors[ci].consumption =
                                            parseFloat(e.target.value) || 0;
                                          setVariantGroups(newGroups);
                                        }}
                                        required
                                      />
                                      {/* Add rate_info fields */}
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Rate"
                                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white w-32"
                                        value={c.rate_info?.rate || 0}
                                        min="0"
                                        onChange={(e) => {
                                          const newGroups = [...variantGroups];
                                          newGroups[vgi].parts[pi].fabrics[
                                            fi
                                          ].colors[ci].rate_info = {
                                            ...newGroups[vgi].parts[pi].fabrics[
                                              fi
                                            ].colors[ci].rate_info,
                                            rate: Number(e.target.value),
                                          };
                                          setVariantGroups(newGroups);
                                        }}
                                      />
                                      <select
                                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white w-32"
                                        value={c.rate_info?.unit_id || 0}
                                        onChange={(e) => {
                                          const newGroups = [...variantGroups];
                                          newGroups[vgi].parts[pi].fabrics[
                                            fi
                                          ].colors[ci].rate_info = {
                                            ...newGroups[vgi].parts[pi].fabrics[
                                              fi
                                            ].colors[ci].rate_info,
                                            unit_id: Number(e.target.value),
                                          };
                                          setVariantGroups(newGroups);
                                        }}
                                      >
                                        <option value={0}>Select Unit</option>
                                        {unitOptions.map((u) => (
                                          <option
                                            key={u.id || u.unit_id}
                                            value={u.id || u.unit_id}
                                          >
                                            {u.name || u.unit_name}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                        onClick={() => {
                                          const newGroups = [...variantGroups];
                                          newGroups[vgi].parts[pi].fabrics[
                                            fi
                                          ].colors = newGroups[vgi].parts[
                                            pi
                                          ].fabrics[fi].colors.filter(
                                            (_, idx) => idx !== ci
                                          );
                                          setVariantGroups(newGroups);
                                        }}
                                      >
                                        <Trash className="inline-block mr-1" />
                                        Remove Color
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="text-blue-600 font-semibold"
                                    onClick={() => {
                                      const newGroups = [...variantGroups];
                                      newGroups[vgi].parts[pi].fabrics[
                                        fi
                                      ].colors.push({
                                        color_id: "",
                                        is_base: false,
                                        consumption: 0.0,
                                      });
                                      setVariantGroups(newGroups);
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
                              className="text-blue-600 font-semibold"
                              onClick={() => {
                                const newGroups = [...variantGroups];
                                newGroups[vgi].parts[pi].fabrics.push({
                                  fabric_type_id: "",
                                  dia: 0.0,
                                  gsm: 0,
                                  colors: [
                                    {
                                      color_id: "",
                                      is_base: false,
                                      consumption: 0.0,
                                    },
                                  ],
                                });
                                setVariantGroups(newGroups);
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
                        className="text-blue-600 font-semibold"
                        onClick={() => {
                          const newGroups = [...variantGroups];
                          newGroups[vgi].parts.push({
                            part_id: "",
                            fabrics: [
                              {
                                fabric_type_id: "",
                                dia: 0.0,
                                gsm: 0,
                                colors: [
                                  {
                                    color_id: "",
                                    is_base: false,
                                    consumption: 0.0,
                                  },
                                ],
                              },
                            ],
                          });
                          setVariantGroups(newGroups);
                        }}
                      >
                        <Plus className="inline-block mr-1" />
                        Add Part
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold"
                    onClick={() =>
                      setVariantGroups([
                        ...variantGroups,
                        {
                          variant: String(variantGroups.length + 1),
                          parts: [
                            {
                              part_id: "",
                              fabrics: [
                                {
                                  fabric_type_id: "",
                                  dia: 0.0,
                                  gsm: 0,
                                  colors: [
                                    {
                                      color_id: "",
                                      is_base: false,
                                      consumption: 0.0,
                                    },
                                  ],
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
                className="bg-foreground text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 font-semibold transition w-full mt-2"
                disabled={uploadLoading}
              >
                {uploadLoading ? "Uploading..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Trims Modal */}
      {accessoriesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative max-h-[95vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() =>
                setAccessoriesModal({
                  open: false,
                  designId: null,
                })
              }
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Upload Trims</h2>
            {/* ...existing code for error/success and form... */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAccessoriesLoading(true);
                setAccessoriesError("");
                setAccessoriesSuccess("");
                // Convert all fields except remarks to numbers
                const payloadAccessories = accessories.map((acc) => ({
                  accessory_id: Number(acc.accessory_id),
                  brand_id: Number(acc.brand_id),
                  color_id: Number(acc.color_id),
                  size_id: Number(acc.size_id),
                  unit_id: Number(acc.unit_id),
                  rate_per_unit: Number(acc.rate_per_unit),
                  required_qty: Number(acc.required_qty),
                  remarks: acc.remarks,
                }));
                try {
                  await axios.post(
                    `${API}so/update-accessories/${accessoriesModal.designId}`,
                    { accessories: payloadAccessories },
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Organization-ID": organizationId,
                      },
                    }
                  );
                  setAccessoriesSuccess("Trims uploaded successfully!");
                  setAccessoriesModal({
                    open: false,
                    designId: null,
                  });
                } catch (err) {
                  setAccessoriesError("Failed to upload trims.");
                } finally {
                  setAccessoriesLoading(false);
                }
              }}
              className="space-y-6 max-h-[80vh] overflow-y-auto"
            >
              {accessories.map((acc, i) => (
                <div
                  key={i}
                  className="border border-blue-300 rounded-xl p-4 mb-4 bg-gray-50"
                >
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Accessory
                      </label>
                      <select
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[150px]"
                        value={acc.accessory_id}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].accessory_id = e.target.value;
                          setAccessories(newAcc);
                        }}
                        // required
                      >
                        <option value="">Select Accessory</option>
                        {accessoryOptions.map((a) => (
                          <option
                            key={a.id || a.accessory_id}
                            value={a.id || a.accessory_id}
                          >
                            {a.name || a.accessory_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Brand
                      </label>
                      <select
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[150px]"
                        value={acc.brand_id}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].brand_id = e.target.value;
                          setAccessories(newAcc);
                        }}
                        // required
                      >
                        <option value="">Select Brand</option>
                        {brandOptions.map((b) => (
                          <option
                            key={b.id || b.brand_id}
                            value={b.id || b.brand_id}
                          >
                            {b.name || b.brand_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Color
                      </label>
                      <select
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[120px]"
                        value={acc.color_id}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].color_id = e.target.value;
                          setAccessories(newAcc);
                        }}
                        required
                      >
                        <option value="">Select Color</option>
                        {colorAccessoryOptions.map((col) => (
                          <option
                            key={col.id || col.color_id}
                            value={col.id || col.color_id}
                          >
                            {col.name || col.color_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Size
                      </label>
                      <select
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[100px]"
                        value={acc.size_id}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].size_id = e.target.value;
                          setAccessories(newAcc);
                        }}
                        // required
                      >
                        <option value="">Select Size</option>
                        {sizeOptions.map((sz) => (
                          <option
                            key={sz.id || sz.size_id}
                            value={sz.id || sz.size_id}
                          >
                            {sz.name || sz.size_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Unit
                      </label>
                      <select
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[100px]"
                        value={acc.unit_id}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].unit_id = e.target.value;
                          setAccessories(newAcc);
                        }}
                        // required
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
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Rate Per Unit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[100px]"
                        value={acc.rate_per_unit}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].rate_per_unit = e.target.value;
                          setAccessories(newAcc);
                        }}
                        // required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-foreground font-medium mb-1">
                        Required Qty
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white min-w-[100px]"
                        value={acc.required_qty}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].required_qty = e.target.value;
                          setAccessories(newAcc);
                        }}
                        required
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-foreground font-medium mb-1">
                        Remarks
                      </label>
                      <input
                        type="text"
                        className="border border-blue-300 px-4 py-2 rounded-lg bg-white"
                        value={acc.remarks}
                        onChange={(e) => {
                          const newAcc = [...accessories];
                          newAcc[i].remarks = e.target.value;
                          setAccessories(newAcc);
                        }}
                        placeholder="Remarks"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                    onClick={() =>
                      setAccessories(accessories.filter((_, idx) => idx !== i))
                    }
                    disabled={accessories.length === 1}
                  >
                    <Trash className="inline-block mr-1" />
                    Remove Accessory
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-foreground font-semibold"
                onClick={() =>
                  setAccessories([
                    ...accessories,
                    {
                      accessory_id: "",
                      brand_id: "",
                      color_id: "",
                      size_id: "",
                      unit_id: "",
                      rate_per_unit: "",
                      required_qty: "",
                      remarks: "",
                    },
                  ])
                }
              >
                <Plus className="inline-block mr-1" />
                Add Accessory
              </button>
              <button
                type="submit"
                className="bg-foreground text-white px-6 py-3 rounded-xl shadow hover:bg-foreground font-semibold transition w-full mt-2"
                disabled={accessoriesLoading}
              >
                {accessoriesLoading ? "Uploading..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Create Design Modal */}
      {createDesignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-hidden">
            <div className=" flex p-5 justify-between items-center bg-foreground">
              <h2 className="text-2xl font-bold text-white">Create Design</h2>
              <button
                className="text-white hover:text-blue-700 text-2xl font-bold"
                onClick={() => setCreateDesignModal(false)}
              >
                &times;
              </button>
            </div>
            <CreateDesignForm
              onClose={() => setCreateDesignModal(false)}
              onSuccess={() => {
                setCreateDesignModal(false);
                setDesignCreated((prev) => !prev);
              }}
            />
          </div>
        </div>
      )}
      {viewAccessoriesModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative max-h-[95vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() =>
                setViewAccessoriesModal({
                  open: false,
                  designId: null,
                })
              }
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Trims</h2>
            {viewAccessoriesLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : viewAccessoriesError ? (
              <div className="text-red-600 mb-2">{viewAccessoriesError}</div>
            ) : viewAccessories.length === 0 ? (
              <div className="text-gray-500">
                No trims found for this design.
              </div>
            ) : (
              <table className="min-w-full rounded-xl mb-2">
                <thead>
                  <tr className="text-left bg-foreground text-white">
                    <th className="px-2 py-1">Trim</th>
                    <th className="px-2 py-1">Brand</th>
                    <th className="px-2 py-1">Color</th>
                    <th className="px-2 py-1">Size</th>
                    <th className="px-2 py-1">Unit</th>
                    <th className="px-2 py-1">Rate/Unit</th>
                    <th className="px-2 py-1">Qty</th>
                    <th className="px-2 py-1">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {viewAccessories.map((acc, idx) => (
                    <tr key={idx} className="border-b border-blue-300">
                      <td className="px-2 py-1">
                        {acc.accessory_name || acc.accessory_id}
                      </td>
                      <td className="px-2 py-1">
                        {acc.brand_name || acc.brand_id}
                      </td>
                      <td className="px-2 py-1">
                        {acc.color_name || acc.color_id}
                      </td>
                      <td className="px-2 py-1">
                        {acc.size_name || acc.size_id}
                      </td>
                      <td className="px-2 py-1">
                        {acc.unit_name || acc.unit_id}
                      </td>
                      <td className="px-2 py-1">{acc.rate_per_unit}</td>
                      <td className="px-2 py-1">{acc.required_qty}</td>
                      <td className="px-2 py-1">{acc.remarks || "-"}</td>
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
