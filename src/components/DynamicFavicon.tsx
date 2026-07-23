import { useEffect } from "react";
import { useSiteSettings } from "@/lib/settings";

export function DynamicFavicon() {
  const { data } = useSiteSettings();
  const url = data?.favicon_url || data?.logo_url;

  useEffect(() => {
    if (typeof document === "undefined" || !url) return;
    const setLink = (rel: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = url;
    };
    setLink("icon");
    setLink("apple-touch-icon");
  }, [url]);

  return null;
}
