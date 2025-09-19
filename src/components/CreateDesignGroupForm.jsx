"use client";
import react, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { API } from "@/utils/url";

export default function CreateDesignGroupForm({
  onClose,
  group,
  onSuccess,
  defaultValue,
}) {
  // Design form state

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  // const [designForm, setDesignForm] = useState({
  //   design_name: "",
  //   party: group ? defaultValue?.party : "",
  //   quantity: group ? defaultValue?.order_quantity : "",
  //   po: "",
  //   design_type_id: group ? defaultValue?.design_type_id : "",
  //   mrp: group ? defaultValue?.mrp : "",
  //   rate: group ? defaultValue?.rate : "",
  //   delivery_date: group ? formatDate(defaultValue?.delivery_date) : "",
  //   validation_type: "",
  //   validation_value: "",
  //   max_valid_limit: "",
  //   min_valid_limit: "",
  //   next_department_id: "",
  // });
  const [designForm, setDesignForm] = useState({
    party: "",
    quantity: "",
    design_type_id: "",
    mrp: "",
    rate: "",
    delivery_date: "",
  });
  const [loading, setLoading] = useState(false);
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
    setLoading(true);

    try {
      const accessToken = await supabase.auth
        .getSession()
        .then(({ data }) => data?.session?.access_token);
      const payload = {
        // design_name: designForm.design_name,
        // details: {
        party: designForm.party,
        quantity: Number(designForm.quantity),
        // po: designForm.po,
        design_type_id: Number(designForm.design_type_id),
        mrp: Number(designForm.mrp),
        rate: Number(designForm.rate),
        delivery_date: designForm.delivery_date,
        //   validation_type: designForm.validation_type || undefined,
        //   validation_value: designForm.validation_value || undefined,
        //   max_valid_limit: designForm.max_valid_limit
        //     ? Number(designForm.max_valid_limit)
        //     : undefined,
        //   min_valid_limit: designForm.min_valid_limit
        //     ? Number(designForm.min_valid_limit)
        //     : undefined,
        //   next_department_id: designForm.next_department_id,
        // },
      };
      // Get organization_id from localStorage
      if (typeof window !== "undefined") {
        const orgs = JSON.parse(localStorage.getItem("organizations"));
        organizationId = orgs?.data?.joined?.[0]?.organization_id || "";
      }

      const { data } = await axios.post(`${API}so/design-group`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Organization-ID": organizationId,
        },
      });
      setDesignResult(data.message || "Design created successfully.");

      setLoading(false);
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Failed to create design.");
      setLoading(false);
    }
  };
  {
    /* Create Design Section */
  }

  return (
    <section className="mb-8 p-8 rounded-2xl max-w-3xl mx-auto ">
      <form
        onSubmit={handleDesignSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* <div>
          <label
            htmlFor="design_name"
            className="block font-medium mb-1 text-purple-800"
          >
            Design Name
          </label>
          <input
            id="design_name"
            name="design_name"
            value={designForm.design_name}
            onChange={handleDesignChange}
            placeholder="Design Name"
            type="text"
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
          />
        </div> */}
        <div>
          <label
            htmlFor="party"
            className="block font-medium mb-1 text-purple-800"
          >
            Party
          </label>
          <select
            id="party"
            name="party"
            value={designForm.party}
            onChange={handleDesignChange}
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
            disabled={group}
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
        </div>
        <div>
          <label
            htmlFor="quantity"
            className="block font-medium mb-1 text-purple-800"
          >
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            value={designForm.quantity}
            onChange={handleDesignChange}
            placeholder="Quantity"
            type="number"
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
            disabled={group}
          />
        </div>
        {/* <div>
          <label
            htmlFor="po"
            className="block font-medium mb-1 text-purple-800"
          >
            PO
          </label>
          <input
            id="po"
            name="po"
            value={designForm.po}
            onChange={handleDesignChange}
            placeholder="PO"
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
          />
        </div> */}
        <div>
          <label
            htmlFor="design_type_id"
            className="block font-medium mb-1 text-purple-800"
          >
            Design Type
          </label>
          <select
            id="design_type_id"
            name="design_type_id"
            value={designForm.design_type_id}
            onChange={handleDesignChange}
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
            disabled={group}
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
        </div>
        <div>
          <label
            htmlFor="mrp"
            className="block font-medium mb-1 text-purple-800"
          >
            MRP
          </label>
          <input
            id="mrp"
            name="mrp"
            value={designForm.mrp}
            onChange={handleDesignChange}
            placeholder="MRP"
            type="number"
            step="0.01"
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
            disabled={group}
          />
        </div>
        <div>
          <label
            htmlFor="rate"
            className="block font-medium mb-1 text-purple-800"
          >
            Rate
          </label>
          <input
            id="rate"
            name="rate"
            value={designForm.rate}
            onChange={handleDesignChange}
            placeholder="Rate"
            type="number"
            step="0.01"
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
            disabled={group}
          />
        </div>
        <div>
          <label
            htmlFor="delivery_date"
            className="block font-medium mb-1 text-purple-800"
          >
            Delivery Date
          </label>
          <input
            id="delivery_date"
            name="delivery_date"
            value={designForm.delivery_date}
            onChange={handleDesignChange}
            placeholder="Delivery Date"
            type="date"
            className="border border-purple-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white w-full"
            required
            disabled={group}
          />
        </div>
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
          className="bg-gradient-to-br from-purple-400 to-purple-600 text-white px-6 py-3 rounded-xl shadow hover:from-purple-500 hover:to-purple-800 font-semibold transition col-span-1 md:col-span-2 mt-2"
        >
          {loading ? "Creating Group ..." : "Create Group"}
        </button>
      </form>
      {designResult && (
        <p className="mt-4 text-green-600 font-semibold">{designResult}</p>
      )}
      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
    </section>
  );
}
