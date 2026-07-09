-- Keep only the six policy groups approved on 2026-07-09.
-- New entries created by admin after this migration are unaffected.
UPDATE "ai_knowledge"
SET "isActive" = false, "updatedAt" = NOW()
WHERE "isActive" = true
  AND "category" IN ('policy', 'shipping', 'payment', 'warranty', 'custom', 'contact', 'shop')
  AND "id" NOT IN (
    'kb-warranty-policy-v2',
    'kb-shipping-policy-v2',
    'kb-payment-policy-v2',
    'kb-custom-policy-v2',
    'kb-contact-policy-v2',
    'kb-shop-commitments-v2'
  );
