import type { Env } from "../config";
import {
  computeOptionPriceFromCosts,
  loadCostChartValues,
  loadDiamondClarityGroups,
  loadDiamondPriceChart,
  loadPriceChartAdjustments,
  resolveDiscountDetails,
} from "../legacy";
import { getString } from "../utils/request-utils";
import { parseDiamondBreakdownComponentsPayload } from "../utils/diamond-utils";

export async function estimatePricing(payload: Record<string, unknown>, env: Env) {
  const diamondComponents = parseDiamondBreakdownComponentsPayload(
    payload.diamond_breakdown_components || payload.diamondBreakdownComponents
  );
  const record = {
    metal: getString(payload.metal),
    metal_weight: getString(payload.metal_weight || payload.metalWeight),
    stone: getString(payload.stone),
    stone_weight: getString(payload.stone_weight || payload.stoneWeight),
    diamond_breakdown: getString(payload.diamond_breakdown || payload.diamondBreakdown),
    size: getString(payload.size),
    size_label: getString(payload.size_label || payload.sizeLabel),
    size_ring: getString(payload.size_ring || payload.sizeRing),
    size_bracelet: getString(payload.size_bracelet || payload.sizeBracelet),
    size_chain: getString(payload.size_chain || payload.sizeChain),
    size_neck: getString(payload.size_neck || payload.sizeNeck),
    size_wrist: getString(payload.size_wrist || payload.sizeWrist),
    quote_discount_type: getString(payload.quote_discount_type || payload.quoteDiscountType),
    quote_discount_percent: getString(payload.quote_discount_percent || payload.quoteDiscountPercent),
  };
  const clarity = getString(payload.clarity);
  const color = getString(payload.color);
  const costValues = await loadCostChartValues(env);
  const diamondPrices = await loadDiamondPriceChart(env);
  const clarityGroups = await loadDiamondClarityGroups(env);
  const adjustments = await loadPriceChartAdjustments(env);
  const discountDetails = resolveDiscountDetails(costValues, record);
  const result = computeOptionPriceFromCosts(
    record,
    clarity,
    color,
    costValues,
    diamondPrices,
    clarityGroups,
    adjustments,
    discountDetails,
    diamondComponents
  );

  return { result, discountDetails };
}
