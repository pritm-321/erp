"use client";
import react, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";

export default function CreateDesign() {
  // Design form state
  const [designForm, setDesignForm] = useState({
    design_name: "",
    party: "",
    quantity: "",
    po: "",
    design_type_id: "",
    mrp: "",
    rate: "",
    delivery_date: "",
    validation_type: "",
    validation_value: "",
    max_valid_limit: "",
    min_valid_limit: "",
    next_department_id: "",
  });
  const [designResult, setDesignResult] = useState("");
  const [error, setError] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  let organizationId = "";
  const [designNameOptions, setDesignNameOptions] = useState([]);
  const [designTypeOptions, setDesignTypeOptions] = useState([]);

  useEffect(() => {
    const fetchPartySuggestions = async () => {
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }
      try {
        const accessToken = await supabase.auth
          .getSession()
          .then(({ data }) => data?.session?.access_token);
        const res = await axios.get(`${API}suggestions/get_suggestion/party`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        setPartyOptions(res.data?.suggestions || []);
      } catch (err) {
        setPartyOptions([]);
      }
    };
    const fetchDesignTypeSuggestions = async () => {
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }
      try {
        const accessToken = await supabase.auth
          .getSession()
          .then(({ data }) => data?.session?.access_token);
        const res = await axios.get(`${API}design/suggestions/design-types`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Organization-ID": organizationId,
          },
        });
        setDesignTypeOptions(res.data?.data || []);
      } catch (err) {
        setDesignTypeOptions([]);
      }
    };
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
    fetchPartySuggestions();
    fetchDesignTypeSuggestions();
    fetchDesignNameSuggestions();
  }, []);

  const handleDesignChange = (e) => {
    setDesignForm({ ...designForm, [e.target.name]: e.target.value });
  };
  const handleDesignSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDesignResult("");
    try {
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const payload = {
        design_name: designForm.design_name,
        details: {
          party: designForm.party,
          quantity: Number(designForm.quantity),
          po: designForm.po,
          design_type_id: Number(designForm.design_type_id),
          mrp: Number(designForm.mrp),
          rate: Number(designForm.rate),
          delivery_date: designForm.delivery_date,
          validation_type: designForm.validation_type || undefined,
          validation_value: designForm.validation_value || undefined,
          max_valid_limit: designForm.max_valid_limit
            ? Number(designForm.max_valid_limit)
            : undefined,
          min_valid_limit: designForm.min_valid_limit
            ? Number(designForm.min_valid_limit)
            : undefined,
          next_department_id: designForm.next_department_id,
        },
      };
      // Get organization_id from localStorage
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }
      const res = await axios.post(`${API}so/create-design`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      setDesignResult("Design created successfully!");
    } catch (err) {
      setError("Failed to create design.");
    }
  };
  {
    /* Create Design Section */
  }

  return (
    <section className="mb-8 p-4 border rounded-lg max-w-7xl">
      <h2 className="text-lg font-semibold mb-2">Create Design</h2>
      <form
        onSubmit={handleDesignSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* <select
          name="design_name"
          value={designForm.design_name}
          onChange={handleDesignChange}
          className="border px-2 py-1 rounded"
          required
        >
          <option value="" disabled>
            Select Design Name
          </option>
          {designNameOptions.map((name, idx) => (
            <option key={idx} value={name}>
              {name}
            </option>
          ))}
        </select> */}
        <input
          name="design_name"
          value={designForm.design_name}
          onChange={handleDesignChange}
          placeholder="Design Name"
          type="text"
          className="border px-2 py-1 rounded"
          required
        />
        <select
          name="party"
          value={designForm.party}
          onChange={handleDesignChange}
          className="border px-2 py-1 rounded"
          required
        >
          <option value="" disabled>
            Select Party
          </option>
          {partyOptions.map((party, idx) => (
            <option key={idx} value={party}>
              {party}
            </option>
          ))}
        </select>
        <input
          name="quantity"
          value={designForm.quantity}
          onChange={handleDesignChange}
          placeholder="Quantity"
          type="number"
          className="border px-2 py-1 rounded"
          required
        />
        <input
          name="po"
          value={designForm.po}
          onChange={handleDesignChange}
          placeholder="PO"
          className="border px-2 py-1 rounded"
          required
        />
        <select
          name="design_type_id"
          value={designForm.design_type_id}
          onChange={handleDesignChange}
          className="border px-2 py-1 rounded"
          required
        >
          <option value="" disabled>
            Select Design Type
          </option>
          {designTypeOptions.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <input
          name="mrp"
          value={designForm.mrp}
          onChange={handleDesignChange}
          placeholder="MRP"
          type="number"
          step="0.01"
          className="border px-2 py-1 rounded"
          required
        />
        <input
          name="rate"
          value={designForm.rate}
          onChange={handleDesignChange}
          placeholder="Rate"
          type="number"
          step="0.01"
          className="border px-2 py-1 rounded"
          required
        />
        <input
          name="delivery_date"
          value={designForm.delivery_date}
          onChange={handleDesignChange}
          placeholder="Delivery Date"
          type="date"
          className="border px-2 py-1 rounded"
          required
        />
        {/* <input
          name="validation_type"
          value={designForm.validation_type}
          onChange={handleDesignChange}
          placeholder="Validation Type (optional)"
          className="border px-2 py-1 rounded"
        />
        <input
          name="validation_value"
          value={designForm.validation_value}
          onChange={handleDesignChange}
          placeholder="Validation Value (optional)"
          className="border px-2 py-1 rounded"
        />
        <input
          name="max_valid_limit"
          value={designForm.max_valid_limit}
          onChange={handleDesignChange}
          placeholder="Max Valid Limit (optional)"
          type="number"
          className="border px-2 py-1 rounded"
        />
        <input
          name="min_valid_limit"
          value={designForm.min_valid_limit}
          onChange={handleDesignChange}
          placeholder="Min Valid Limit (optional)"
          type="number"
          className="border px-2 py-1 rounded"
        />
        <input
          name="next_department_id"
          value={designForm.next_department_id}
          onChange={handleDesignChange}
          placeholder="Next Department ID"
          className="border px-2 py-1 rounded"
        /> */}
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2"
        >
          Create Design
        </button>
      </form>
      {designResult && <p className="mt-2 text-green-600">{designResult}</p>}
    </section>
  );
}
