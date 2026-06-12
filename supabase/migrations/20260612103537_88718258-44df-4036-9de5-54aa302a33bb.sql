
REVOKE EXECUTE ON FUNCTION public.enforce_booking_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_booking_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_order_item_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_order_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_order_insert() FROM PUBLIC, anon, authenticated;
