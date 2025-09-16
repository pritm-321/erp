"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/utils/supabaseClient";
import { API } from "@/utils/url";
import { Upload, Search } from "lucide-react";
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
  const [sortType, setSortType] = useState("");
  const [searchParty, setSearchParty] = useState("");
  const [searchDate, setSearchDate] = useState("");

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
  let groupedEntries = Object.entries(grouped);
  console.log(JSON.stringify(groupedEntries, null, 2), "groupedEntries");

  if (sortType === "name") {
    groupedEntries = groupedEntries.sort((a, b) => {
      // Use first design's party for each group
      const nameA = a[1][0]?.party?.toLowerCase() || "";
      const nameB = b[1][0]?.party?.toLowerCase() || "";
      console.log(nameA, nameB, "names");

      return nameA.localeCompare(nameB);
    });
  } else if (sortType === "date") {
    groupedEntries = groupedEntries.sort((a, b) => {
      // Use earliest delivery_date in each group
      const getEarliestDate = (arr) => {
        return arr.reduce((min, d) => {
          const dt = new Date(d.delivery_date);
          return !min || dt < min ? dt : min;
        }, null);
      };
      const dateA = getEarliestDate(a[1]);
      const dateB = getEarliestDate(b[1]);
      return dateA - dateB;
    });
  }

  // Filter by searchParty and searchDate
  if (searchParty) {
    groupedEntries = groupedEntries.filter(([key, group]) => {
      const party = group[0]?.party?.toLowerCase() || "";
      const designType = group[0]?.design_type?.toLowerCase() || "";
      // Check if any design in group matches design_name
      const hasDesignName = group.some((d) =>
        d.design_name?.toLowerCase().includes(searchParty.toLowerCase())
      );
      // Check if input is a date (YYYY-MM-DD)

      return (
        party.includes(searchParty.toLowerCase()) ||
        designType.includes(searchParty.toLowerCase()) ||
        hasDesignName
      );
    });
  }
  if (searchDate) {
    groupedEntries = groupedEntries.filter(([key, group]) => {
      // Match if any design in group has delivery_date matching searchDate
      return group.some((d) => {
        const dDate = new Date(d.delivery_date);
        const sDate = new Date(searchDate);
        return (
          dDate.getFullYear() === sDate.getFullYear() &&
          dDate.getMonth() === sDate.getMonth() &&
          dDate.getDate() === sDate.getDate()
        );
      });
    });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="w-full mx-auto p-8  bg-white h-screen overflow-y-scroll">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-purple-900">
            Grouped Designs
          </h1>
          <div className="flex gap-2 items-center">
            <button
              className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-700 transition font-semibold"
              onClick={() => setCreateDesignModal(true)}
            >
              + Create Design
            </button>
          </div>
        </div>
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Search by Party Name / Design Type / Design Name "
              className="pl-10 w-[480px] border border-purple-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              value={searchParty}
              onChange={(e) => setSearchParty(e.target.value)}
            />
          </div>
          <input
            type="date"
            placeholder="Search by Delivery Date"
            className="border border-purple-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <button
            className={`bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition font-semibold ${
              sortType === "name" ? "ring-2 ring-purple-700" : ""
            }`}
            onClick={() => setSortType("name")}
          >
            Sort by Party Name
          </button>
          <button
            className={`bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition font-semibold ${
              sortType === "date" ? "ring-2 ring-purple-700" : ""
            }`}
            onClick={() => setSortType("date")}
          >
            Sort by Delivery Date
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
            <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-hidden">
              <div className=" flex p-5 justify-between items-center bg-gradient-to-br from-purple-700 to-blue-400">
                <h2 className="text-2xl font-bold text-white">Create Design</h2>
                <button
                  className="text-white hover:text-purple-700 text-2xl font-bold"
                  onClick={() => setCreateDesignModal(false)}
                >
                  &times;
                </button>
              </div>
              <CreateDesignForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
