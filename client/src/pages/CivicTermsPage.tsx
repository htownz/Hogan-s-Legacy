import React from "react";
import CivicTermsAdmin from "@/components/civic-learning/CivicTermsAdmin";
import { CivicTermsProvider } from "@/components/civic-learning/CivicTermsProvider";

/**
 * Admin page for managing civic terms
 * This page allows admin users to create, edit, and delete civic terms
 * used throughout the application for the "I'm Just a Bill" learning feature
 */
const CivicTermsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Civic Terms Database</h1>
        <p className="text-gray-500 mt-2">
          Manage the civic terms used throughout the application to help users understand
          legislation and civic processes. These terms power the "I'm Just a Bill" character
          tooltips and learning features.
        </p>
      </div>
      
      <CivicTermsProvider>
        <CivicTermsAdmin />
      </CivicTermsProvider>
    </div>
  );
};

export default CivicTermsPage;