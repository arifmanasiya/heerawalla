// Placeholder integration surface; swap to Netlify Functions later.

export async function createOrder(payload: Record<string, unknown>) {
  console.warn('createOrder is not implemented. Payload:', payload);
  return { ok: false, message: 'Not implemented' };
}

export async function startCheckout(payload: Record<string, unknown>) {
  console.warn('startCheckout is not implemented. Payload:', payload);
  return { ok: false, message: 'Not implemented' };
}

export async function submitLead(payload: Record<string, unknown>) {
  console.warn('submitLead is not implemented. Payload:', payload);
  return { ok: false, message: 'Not implemented' };
}
