"use client";
import react, { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";
import { Upload } from "lucide-react";

export default function CreateDesignForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const [designName, setDesignName] = useState("");
  const [designResult, setDesignResult] = useState("");
  const [error, setError] = useState("");
  const [designNameOptions, setDesignNameOptions] = useState([]);

  let organizationId = "";

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const fetchDesignNameSuggestions = async () => {
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }
      try {
        const accessToken = await supabase.auth
          .getSession()
          .then(({ data }) => data?.session?.access_token);
        const res = await axios.get(
          `${API}design/suggestions/get_suggestion/design_no`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Organization-ID": organizationId,
            },
          }
        );
        console.log(res.data);

        setDesignNameOptions(res.data?.design_nos || []);
      } catch (err) {
        setDesignNameOptions([]);
      }
    };

    fetchDesignNameSuggestions();
  }, []);

  const handleDesignChange = (e) => {
    setDesignName(e.target.value);
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
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }
      const formData = new FormData();
      formData.append("design_name", designName);
      formData.append("file", file);
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
      setError("Failed to create design.");
      console.log(err);
    }
    // onClose(setCreateDesignModal(true));
  };
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="mb-8 p-8 rounded-2xl max-w-3xl mx-auto ">
      <form onSubmit={handleDesignSubmit} className="grid grid-cols-1 gap-6">
        <div className="flex flex-col">
          <button
            onClick={triggerImageUpload}
            className="bg-purple-100 text-gray-900 hover:bg-gray-100 py-2 mb-2 flex justify-center items-center rounded-xl"
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
        <br />
        <div>
          <label
            htmlFor="design_name"
            className="block font-medium mb-1 text-purple-800"
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
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-gradient-to-br from-purple-400 to-purple-600 text-white px-6 py-3 rounded-xl shadow hover:from-purple-500 hover:to-purple-800 font-semibold transition col-span-1 md:col-span-2 mt-2"
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
