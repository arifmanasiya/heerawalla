(() => {
  const FALLBACK_ENUMS = {
    design_codes: [
      { value: "Axis", label: "Axis" },
      { value: "Continuum", label: "Continuum" },
      { value: "Eclipse", label: "Eclipse" },
      { value: "Meridian", label: "Meridian" },
      { value: "Helix", label: "Helix" },
    ],
    collections: [
      { value: "Axis", label: "Axis" },
      { value: "Continuum", label: "Continuum" },
      { value: "Eclipse", label: "Eclipse" },
    ],
    genders: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "unisex", label: "Unisex" },
    ],
    categories: [],
    styles: [],
    motifs: [],
    metals: [
      { value: "14K Yellow Gold", label: "14K Yellow Gold" },
      { value: "14K White Gold", label: "14K White Gold" },
      { value: "14K Rose Gold", label: "14K Rose Gold" },
      { value: "18K Yellow Gold", label: "18K Yellow Gold" },
      { value: "18K White Gold", label: "18K White Gold" },
      { value: "18K Rose Gold", label: "18K Rose Gold" },
      { value: "Platinum", label: "Platinum" },
    ],
    stone_types: [
      { value: "Lab Grown Diamond", label: "Lab Grown Diamond" },
      { value: "Natural Diamond", label: "Natural Diamond" },
    ],
    stone_roles: [
      { value: "center", label: "Center" },
      { value: "accent", label: "Accent" },
      { value: "side", label: "Side" },
      { value: "halo", label: "Halo" },
    ],
    cuts: [
      { value: "Ideal", label: "Ideal" },
      { value: "Excellent", label: "Excellent" },
      { value: "Very Good", label: "Very Good" },
    ],
    clarities: [
      { value: "IF", label: "IF" },
      { value: "VVS1", label: "VVS1" },
      { value: "VVS2", label: "VVS2" },
      { value: "VS1", label: "VS1" },
      { value: "VS2", label: "VS2" },
      { value: "SI1", label: "SI1" },
      { value: "SI2", label: "SI2" },
    ],
    colors: [
      { value: "D", label: "D" },
      { value: "E", label: "E" },
      { value: "F", label: "F" },
      { value: "G", label: "G" },
      { value: "H", label: "H" },
      { value: "I", label: "I" },
      { value: "J", label: "J" },
    ],
    media_positions: [
      { value: "hero", label: "Hero" },
      { value: "gallery", label: "Gallery" },
      { value: "detail", label: "Detail" },
    ],
    tags: [],
  };

  let cached = null;

  async function fetchEnumCatalogs(apiBase) {
    if (cached) return cached;
    const base =
      apiBase ||
      (document.body && document.body.dataset.apiBase) ||
      "";
    if (!base) {
      cached = FALLBACK_ENUMS;
      return cached;
    }
    const normalized = base.endsWith("/") ? base : `${base}/`;
    try {
      const response = await fetch(`${normalized}enums`);
      if (!response.ok) throw new Error("enum_fetch_failed");
      const data = await response.json();
      cached = data || FALLBACK_ENUMS;
      return cached;
    } catch {
      cached = FALLBACK_ENUMS;
      return cached;
    }
  }

  const exports = { fetchEnumCatalogs, FALLBACK_ENUMS };
  if (typeof window !== "undefined") {
    window.AdminEnums = exports;
  } else {
    globalThis.AdminEnums = exports;
  }
})();
