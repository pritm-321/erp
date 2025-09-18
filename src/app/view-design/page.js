"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/utils/supabaseClient";
import { API } from "@/utils/url";
import { Upload, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import CreateDesignGroupForm from "@/components/CreateDesignGroupForm";

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
    const fetchMerchantAndDesign = async (page = 1) => {
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
        const { data } = await axios.get(
          `${API}design/merchant/${merchantRes.data?.data.departments[0]?.department_id}/groups`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Organization-ID": organizationId,
            },
          }
        );
        console.log(data, " designs");

        setDesigns(data.data.groups); // Assuming we want the first design
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
  // const grouped = {};
  // designs.forEach((d) => {
  //   const key = [
  //     d.party,
  //     d.order_quantity,
  //     d.design_type,
  //     d.mrp,
  //     d.rate,
  //     d.delivery_date,
  //   ].join("|");
  //   if (!grouped[key]) grouped[key] = [];
  //   grouped[key].push(d);
  // });
  // let groupedEntries = designs.groups;
  let groupedEntries = designs;
  // console.log(groupedEntries, "grouped entries");

  // Initial sort by created_at descending
  if (groupedEntries && Array.isArray(groupedEntries)) {
    groupedEntries = groupedEntries.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
  }

  if (sortType === "name") {
    groupedEntries = groupedEntries.sort((a, b) => {
      // Use first design's party for each group
      const nameA = a[0]?.party?.toLowerCase() || "";
      const nameB = b[0]?.party?.toLowerCase() || "";
      console.log(nameA, nameB, "names");

      return nameA.localeCompare(nameB);
    });
  } else if (sortType === "date") {
    groupedEntries = groupedEntries.sort((a, b) => {
      // Use earliest delivery_date in each group
      const dateA = new Date(a.delivery_date);
      const dateB = new Date(b.delivery_date);
      return dateB - dateA;
    });
  }

  // Filter by searchParty and searchDate
  let filteredEntries = groupedEntries;
  if (searchParty) {
    filteredEntries = filteredEntries.filter((g) => {
      const party = g.party?.toLowerCase() || "";
      const designType = g.design_type?.toLowerCase() || "";
      return (
        party.includes(searchParty.toLowerCase()) ||
        designType.includes(searchParty.toLowerCase())
      );
    });
  }
  if (searchDate) {
    filteredEntries = filteredEntries.filter(([key, group]) => {
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
              placeholder="Search by Party Name / Design Type "
              className="pl-10 w-[340px] border border-purple-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
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
          {/* <button
            className={`bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition font-semibold ${
              sortType === "date" ? "ring-2 ring-purple-700" : ""
            }`}
            onClick={() => setSortType("date")}
          >
            Sort by Created Date
          </button> */}
        </div>
        {filteredEntries?.length === 0 ? (
          <div className="p-4 text-gray-500">
            No designs found or loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredEntries?.map((g, idx) => {
              // const [
              //   party,
              //   order_quantity,
              //   design_type,
              //   mrp,
              //   rate,
              //   delivery_date,
              // ] = key.split("|");
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl shadow bg-gray-50 border border-purple-200"
                >
                  <div className="mb-2 text-lg font-semibold text-purple-800">
                    Party: <span className="font-bold">{g.party}</span>
                  </div>
                  <div className="mb-2">
                    Order Quantity:{" "}
                    <span className="font-bold">{g.quantity}</span>
                  </div>
                  <div className="mb-2">
                    Design Type:{" "}
                    <span className="font-bold">{g.design_type}</span>
                  </div>
                  <div className="mb-2">
                    MRP: <span className="font-bold">{g.mrp}</span>
                  </div>
                  <div className="mb-2">
                    Rate: <span className="font-bold">{g.rate}</span>
                  </div>
                  <div className="mb-2">
                    Created Date: {""}
                    <span className="font-bold">
                      {formatToIST(g.created_at)}
                    </span>
                  </div>
                  <div className="mb-2">
                    Delivery Date: {""}
                    <span className="font-bold">
                      {formatToIST(g.delivery_date)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                      onClick={() => {
                        // Store all designs in this group in localStorage
                        if (typeof window !== "undefined") {
                          localStorage.setItem("group_id", g.group_id || "");
                        }
                        // Redirect to group details page with groupId
                        router.push(
                          `/view-design/${encodeURIComponent(g.party)}`
                        );
                      }}
                    >
                      View Designs
                    </button>
                  </div>
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
                <h2 className="text-2xl font-bold text-white">
                  Create Design Group
                </h2>
                <button
                  className="text-white hover:text-purple-700 text-2xl font-bold"
                  onClick={() => setCreateDesignModal(false)}
                >
                  &times;
                </button>
              </div>
              <CreateDesignGroupForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
