export function getCostChartDetailFields({ item }) {
  return [
    ["Row", item.row_number],
    ["Key", item.key],
    ["Value", item.value],
    ["Unit", item.unit],
    ["Notes", item.notes],
  ];
}

export function getDiamondPriceDetailFields({ item }) {
  return [
    ["Row", item.row_number],
    ["Clarity", item.clarity],
    ["Color", item.color],
    ["Weight min", item.weight_min],
    ["Weight max", item.weight_max],
    ["Price per ct", item.price_per_ct],
    ["Notes", item.notes],
  ];
}
