# Marketing Attribution Testing Checklist

## Before Going Live with Ads

### 1. UTM Tracking Test
- [ ] Visit: `https://www.heerawalla.com/contact?intent=consultation&utm_source=google&utm_medium=cpc&utm_campaign=test_campaign`
- [ ] Open DevTools -> Application -> Session Storage
- [ ] Verify `heerawalla_marketing` contains UTM parameters
- [ ] Submit form
- [ ] Check D1 database - verify UTM parameters stored

### 2. Analytics Test
- [ ] Visit consultation page
- [ ] Open GA4 Real-Time report
- [ ] Verify `view_consultation_page` event fires
- [ ] Start filling form
- [ ] Verify `begin_consultation_form` event fires
- [ ] Submit form
- [ ] Verify `generate_lead` event fires

### 3. Meta Pixel Test
- [ ] Open Meta Events Manager
- [ ] Visit consultation page
- [ ] Verify `ViewContent` event
- [ ] Submit form
- [ ] Verify `Lead` event

### 4. "How did you hear about us?" Test
- [ ] Fill form with different dropdown options
- [ ] Submit multiple test bookings
- [ ] Verify in admin dashboard under "How Did You Hear About Us?"

### 5. Admin Dashboard Test
- [ ] Access `business.heerawalla.com/consultations.html`
- [ ] Verify stats populate correctly
- [ ] Test date range filters
- [ ] Check campaign performance table

## Campaign Testing Protocol

When launching a new Google Ads or Meta Ads campaign:

1. Create test URL with UTM parameters:
   ```
   utm_source=google (or facebook)
   utm_medium=cpc (or social)
   utm_campaign=your_campaign_name
   utm_content=ad_variation_name
   utm_term=target_keyword (for search ads)
   ```

2. Click test ad -> verify UTM capture -> submit form

3. Within 24 hours, check admin dashboard to confirm booking attributed to correct campaign

4. Weekly: Review admin dashboard to identify best-performing campaigns
