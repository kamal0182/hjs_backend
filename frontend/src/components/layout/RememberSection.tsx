import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { saveSection } from "../../lib/sectionMemory";

export function RememberSection() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/login") saveSection(pathname);
  }, [pathname]);
  return null;
}
