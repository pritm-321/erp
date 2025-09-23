"use client";
import Sidebar from "@/components/Sidebar";
import { useParams } from "next/navigation";

export default function OrganizationDetails() {
  const params = useParams();
  const orgId = params.orgId;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-8 text-foreground">
          Organization: {orgId}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Purchase Orders
            </h2>
            <p className="text-gray-600 mb-4">
              View and manage all purchase orders for this organization.
            </p>
            <button className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition">
              Go to Purchase Orders
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Report</h2>
            <p className="text-gray-600 mb-4">
              View organization reports and analytics.
            </p>
            <button className="bg-foreground text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition">
              Go to Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
