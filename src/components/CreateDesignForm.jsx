"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";
import { Upload } from "lucide-react";

export default function CreateDesignForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const [designName, setDesignName] = useState("");
  const [designResult, setDesignResult] = useState("");
  const [error, setError] = useState("");
  const [designNameOptions, setDesignNameOptions] = useState([]); // array of design objects
  const [copyFromDesignId, setCopyFromDesignId] = useState(""); // selected design id to copy from

  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orgs = localStorage.getItem("organizationId");
      setOrganizationId(orgs || "");
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data?.session?.access_token || "");
      });
    }
  }, [accessToken, organizationId]);
  // fetch designs in the current group to populate dropdown
  useEffect(() => {
    if (accessToken && organizationId) {
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

          setDesignNameOptions(data.data.designs || {});
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
  }, [accessToken, organizationId]);

  const handleDesignChange = (e) => {
    setDesignName(e.target.value);
  };
  const handleCopyFromChange = (e) => {
    const selectedId = e.target.value;
    setCopyFromDesignId(selectedId);
    if (!selectedId) return;
    const selected = designNameOptions.find(
      (ds) => ds.design_id === selectedId
    );
    if (selected?.design_name) {
      setDesignName(selected.design_name);
    }
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile);
    if (selectedFile) {
      // Set designName to current designName or file's original name, only once when file is uploaded
      setDesignName(
        selectedFile.name.slice(0, selectedFile.name.lastIndexOf("."))
      );
    }
  };
  const handleDesignSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDesignResult("");
    setLoading(true);
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("design_name", designName);
      // include file as before
      formData.append("file", file);
      // include copy_from_design_id only if user selected one
      if (copyFromDesignId) {
        formData.append("copy_from_design_id", copyFromDesignId);
      }
      const group_id = localStorage.getItem("group_id");
      const res = await axios.post(`${API}so/create/${group_id}`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
          "Content-Type": "multipart/form-data",
        },
      });
      setDesignResult("Design created successfully!");
      setLoading(false);
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create design.");
      setLoading(false);
      console.log(err);
    }
    // onClose(setCreateDesignModal(true));
  };
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="mb-8 p-8 rounded-2xl max-w-3xl mx-auto ">
      <form onSubmit={handleDesignSubmit} className=" space-y-6">
        {/* Dropdown to optionally copy from an existing design */}

        <div className="flex flex-col">
          <button
            onClick={triggerImageUpload}
            className="bg-blue-100 text-gray-900 hover:bg-gray-100 py-2 mb-2 flex justify-center items-center rounded-xl"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            required
            className="hidden"
          />
          {file ? file.name : "No Image file selected"}
        </div>
        <div>
          <label
            htmlFor="design_name"
            className="block font-medium mb-1 text-blue-800"
          >
            Design Name
          </label>
          <input
            id="design_name"
            name="design_name"
            value={designName}
            onChange={handleDesignChange}
            placeholder="Design Name"
            type="text"
            className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="block font-medium mb-1 text-blue-800">
            Copy From Design (optional)
          </label>
          <select
            value={copyFromDesignId}
            onChange={handleCopyFromChange}
            className="border border-blue-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-full"
          >
            <option value="">-- None --</option>
            {designNameOptions.map((opt) => (
              <option
                key={opt.design_id || opt.id}
                value={opt.design_id || opt.id}
              >
                {opt.design_name || opt.name || opt.design_no || opt.id}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-foreground text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 font-semibold transition col-span-1 md:col-span-2 mt-2"
        >
          {loading ? "Creating Design ..." : "Create Design"}
        </button>
      </form>
      {designResult && (
        <p className="mt-4 text-green-600 font-semibold">{designResult}</p>
      )}
      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
    </section>
  );
}
