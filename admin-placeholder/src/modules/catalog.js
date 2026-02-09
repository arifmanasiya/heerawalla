export function createCatalogHelpers({
  apiBase,
  ui,
  normalizeImageUrl,
  escapeAttribute,
}) {
  const catalogCache = { data: null, promise: null };
  const mediaCache = new Map();

  const getCatalogBase = () => {
    return apiBase.replace(/\/admin\/?$/, "");
  };

  const extractSlug = (url) => {
    if (!url) return "";
    try {
      const parsed = new URL(url, "https://www.heerawalla.com");
      const parts = parsed.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1] || "";
      if (last.toLowerCase() === "bespoke" && parts.length > 1) {
        return parts[parts.length - 2] || "";
      }
      return last;
    } catch {
      return "";
    }
  };

  const extractCatalogType = (url) => {
    if (!url) return "";
    try {
      const parsed = new URL(url, "https://www.heerawalla.com");
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.includes("inspirations")) return "inspirations";
      if (parts.includes("product") || parts.includes("products")) return "products";
      return "";
    } catch {
      return "";
    }
  };

  const slugifyCategory = (value) => {
    return String(value || "uncategorized")
      .split("/")
      .map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "uncategorized")
      .filter(Boolean)
      .join("/");
  };

  const buildProductImageFallbacks = (entry) => {
    const categorySlug = slugifyCategory(entry.category || "uncategorized");
    const folder = `/images/products/${categorySlug}/${entry.id}`;
    const candidates = [
      "img-hero-1.png",
      "img-hero-1.jpeg",
      "img-hero-1.jpg",
      "img-hero-2.png",
      "img-hero-2.jpeg",
      "img-hero-2.jpg",
      "img-hero-03.jpeg",
      "img-1.png",
      "img-1.jpeg",
      "img-1.jpg",
      "image-1.svg",
    ].map((file) => `${folder}/${file}`);
    candidates.push(`/images/products/${categorySlug}/image-1.svg`);
    candidates.push("/images/products/placeholder.svg");
    return candidates;
  };

  const collectImageUrls = (entry) => {
    if (!entry) {
      return [normalizeImageUrl("/images/products/placeholder.svg")].filter(Boolean);
    }
    let candidates = [];
    if (entry.hero_image) candidates.push(entry.hero_image);
    if (entry.heroImage) candidates.push(entry.heroImage);
    if (Array.isArray(entry.images)) {
      entry.images.forEach((image) => candidates.push(image));
    }
    if (!candidates.length && entry.id && entry.category) {
      candidates = buildProductImageFallbacks(entry);
    }
    if (!candidates.length) {
      candidates = ["/images/products/placeholder.svg"];
    }
    return Array.from(new Set(candidates.map(normalizeImageUrl).filter(Boolean)));
  };

  const loadCatalog = async () => {
    if (catalogCache.data) return catalogCache.data;
    if (catalogCache.promise) return catalogCache.promise;
    const url = `${getCatalogBase()}/catalog?include=products,inspirations`;
    catalogCache.promise = fetch(url)
      .then((response) => response.json())
      .then((data) => {
        catalogCache.data = data || {};
        return catalogCache.data;
      })
      .catch(() => {
        catalogCache.data = {};
        return catalogCache.data;
      })
      .finally(() => {
        catalogCache.promise = null;
      });
    return catalogCache.promise;
  };

  const resolveCatalogEntry = (item, catalog) => {
    if (!catalog) return null;
    const url = item.product_url || "";
    const slug = extractSlug(url);
    const type = extractCatalogType(url);
    const designCode = item.design_code || "";
    const name = item.product_name || "";
    const inspirations = Array.isArray(catalog.inspirations) ? catalog.inspirations : [];
    const products = Array.isArray(catalog.products) ? catalog.products : [];
    const byDesignCode = (entry) =>
      designCode &&
      (entry.design_code || entry.designCode || "").toLowerCase() === designCode.toLowerCase();
    const byName = (entry) =>
      name && String(entry.name || entry.title || "").toLowerCase() === name.toLowerCase();
    const bySlug = (entry) => slug && String(entry.slug || "").toLowerCase() === slug.toLowerCase();
    if (type === "inspirations") {
      return inspirations.find(bySlug) || inspirations.find(byDesignCode) || inspirations.find(byName) || null;
    }
    if (type === "products") {
      return products.find(bySlug) || products.find(byDesignCode) || products.find(byName) || null;
    }
    return (
      inspirations.find(bySlug) ||
      products.find(bySlug) ||
      inspirations.find(byDesignCode) ||
      products.find(byDesignCode) ||
      inspirations.find(byName) ||
      products.find(byName) ||
      null
    );
  };

  const buildMediaCarousel = (images) => {
    const safeImages = Array.isArray(images) ? images : [];
    const fallback = escapeAttribute(normalizeImageUrl("/images/products/placeholder.svg"));
    const slides = safeImages
      .map(
        (src) =>
          `<div class="media-slide"><img src="${escapeAttribute(src)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';"></div>`
      )
      .join("");
    return `
      <div class="media-carousel" data-media-carousel>
        <button class="carousel-btn" type="button" data-carousel-prev aria-label="Previous image">‹</button>
        <div class="media-track" data-carousel-track>${slides}</div>
        <button class="carousel-btn" type="button" data-carousel-next aria-label="Next image">›</button>
      </div>`;
  };

  const renderQuoteMediaSlot = () => {
    return '<div class="media-slot" data-media-slot><span class="muted">Loading images...</span></div>';
  };

  const refreshQuoteMedia = async (item) => {
    if (!ui.detailGrid) return;
    const slot = ui.detailGrid.querySelector("[data-media-slot]");
    if (!slot) return;
    const cacheKey = item.design_code || item.product_url || item.product_name || "";
    if (cacheKey && mediaCache.has(cacheKey)) {
      slot.innerHTML = buildMediaCarousel(mediaCache.get(cacheKey));
      return;
    }
    const catalog = await loadCatalog();
    const entry = resolveCatalogEntry(item, catalog);
    const images = collectImageUrls(entry);
    if (cacheKey) mediaCache.set(cacheKey, images);
    slot.innerHTML = buildMediaCarousel(images);
  };

  return {
    collectImageUrls,
    getCatalogBase,
    loadCatalog,
    refreshQuoteMedia,
    renderQuoteMediaSlot,
    resolveCatalogEntry,
  };
}
