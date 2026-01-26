const fs = require("fs");
const path = require("path");
const vm = require("vm");

const utilsPath = path.join(__dirname, "..", "admin-placeholder", "catalog-utils.js");
const code = fs.readFileSync(utilsPath, "utf8");
const context = { console, globalThis: {} };
vm.createContext(context);
vm.runInContext(code, context);

const CatalogUtils = context.globalThis.CatalogUtils;
if (!CatalogUtils) {
  console.error("CatalogUtils not found in admin-placeholder/catalog-utils.js");
  process.exit(1);
}

const enums = {
  design_codes: [{ value: "Axis", label: "Axis" }],
  collections: [{ value: "Axis", label: "Axis" }],
  genders: [{ value: "female", label: "Female" }],
  categories: [{ value: "women/sets", label: "Women sets" }],
  styles: [{ value: "Solitaire", label: "Solitaire" }],
  motifs: [{ value: "Chevron", label: "Chevron" }],
  metals: [{ value: "18K Yellow Gold", label: "18K Yellow Gold" }],
  stone_types: [{ value: "Lab Grown Diamond", label: "Lab Grown Diamond" }],
  cuts: [{ value: "Ideal", label: "Ideal" }],
  clarities: [{ value: "VVS1", label: "VVS1" }],
  colors: [{ value: "E", label: "E" }],
  tags: [{ value: "hero", label: "Hero" }],
};

const samples = [
  {
    name: "Legacy pipe",
    item: {
      name: "Axis Sample",
      slug: "Axis Sample",
      design_code: "Axis",
      categories: "women/sets|women/sets",
      metals: '["18K Yellow Gold"]',
      stone_types: "Lab Grown Diamond",
      cut: "BRILLIANT",
      clarity: "VVS1",
      color: "E|F",
      takeaways: "One|Two",
      translation_notes: "First note|Second note",
      is_active: "1",
    },
  },
  {
    name: "Unknown enum values",
    item: {
      name: "Unknowns",
      slug: "unknowns",
      design_code: "Unknown",
      categories: "custom/sets",
      metals: "Mystery Metal",
      stone_types: "Unknown Stone",
      is_active: "true",
    },
  },
];

samples.forEach((sample) => {
  const parsed = CatalogUtils.parseLegacyFields(sample.item, enums);
  const normalized = CatalogUtils.normalizeCatalogItem(parsed, enums);
  const validation = CatalogUtils.validateCatalogItem(parsed, enums, { items: [] });
  console.log(`\n=== ${sample.name} ===`);
  console.log("Parsed:", parsed);
  console.log("Normalized fields:", normalized.fields);
  console.log("Validation:", validation);
});
