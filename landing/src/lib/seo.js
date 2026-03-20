import { useEffect } from "react";
import { SITE_NAME } from "./config";

const DEFAULT_DESCRIPTION =
  "YUAI Marketop - Market insights and curated products in one place. Instagram & Threads bio link hub.";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=630&fit=crop";

function upsertMeta(attrName, attrValue, content) {
  if (typeof document === "undefined") return;
  const selector = `meta[${attrName}="${attrValue}"]`;
  let node = document.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attrName, attrValue);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertCanonical(href) {
  if (typeof document === "undefined") return;
  let node = document.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function toAbsoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function useSeoMeta(options) {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    path = "/",
    noIndex = false,
  } = options ?? {};

  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = pageTitle;

    const absoluteImage = toAbsoluteUrl(image) || toAbsoluteUrl(DEFAULT_IMAGE);
    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`
        : path;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", absoluteUrl);
    upsertMeta("property", "og:image", absoluteImage);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", pageTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", absoluteImage);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertCanonical(absoluteUrl);
  }, [title, description, image, path, noIndex]);
}

