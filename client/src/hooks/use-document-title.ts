import { useEffect, useRef } from "react";

/**
 * Hook to set the document title and restore the previous title when component unmounts
 */
export function useDocumentTitle(title: string) {
  const previousTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;

    // Restore the previous title when component unmounts
    return () => {
      document.title = previousTitle.current;
    };
  }, [title]);
}