import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = "G-0BKT3Y1JY6";

/**
 * Sends a page_view event to GA4 on every SPA route change.
 * Must be rendered inside <BrowserRouter>.
 */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const w = window as any;
    if (typeof w.gtag !== "function") return;

    // Send page_view with the updated path + search params
    w.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_title: document.title,
      send_to: GA_ID,
    });
  }, [location.pathname, location.search]);

  return null;
}
