import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CivicTerm } from "@shared/schema-civic-terms";

interface CivicTermsContextValue {
  terms: CivicTerm[];
  isLoading: boolean;
  error: Error | null;
  findTermByName: (name: string) => CivicTerm | undefined;
  findTermById: (id: number) => CivicTerm | undefined;
  findTermsByCategory: (category: string) => CivicTerm[];
}

const CivicTermsContext = createContext<CivicTermsContextValue | undefined>(undefined);

export const useCivicTerms = (): CivicTermsContextValue => {
  const context = useContext(CivicTermsContext);
  if (!context) {
    throw new Error("useCivicTerms must be used within a CivicTermsProvider");
  }
  return context;
};

interface CivicTermsProviderProps {
  children: React.ReactNode;
}

export const CivicTermsProvider: React.FC<CivicTermsProviderProps> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);

  // Fetch all civic terms
  const { data: terms = [], isLoading } = useQuery<CivicTerm[]>({
    queryKey: ["/api/civic-terms"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/civic-terms");
        if (!response.ok) {
          throw new Error("Failed to fetch civic terms");
        }
        return response.json();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return [];
      }
    },
  });

  // Helper functions for finding terms
  const findTermByName = (name: string): CivicTerm | undefined => {
    return terms.find((term) => term.term.toLowerCase() === name.toLowerCase());
  };

  const findTermById = (id: number): CivicTerm | undefined => {
    return terms.find((term) => term.id === id);
  };

  const findTermsByCategory = (category: string): CivicTerm[] => {
    return terms.filter((term) => term.category === category);
  };

  const contextValue: CivicTermsContextValue = {
    terms,
    isLoading,
    error,
    findTermByName,
    findTermById,
    findTermsByCategory,
  };

  return (
    <CivicTermsContext.Provider value={contextValue}>
      {children}
    </CivicTermsContext.Provider>
  );
};