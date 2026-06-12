
-- 1. Gardener services: require gardener role
DROP POLICY IF EXISTS "Gardeners manage own services" ON public.gardener_services;
CREATE POLICY "Gardeners manage own services" ON public.gardener_services
  FOR ALL TO authenticated
  USING ((auth.uid() = gardener_id AND public.has_role(auth.uid(), 'gardener'::app_role)) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = gardener_id AND public.has_role(auth.uid(), 'gardener'::app_role)) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Booking price enforcement (BEFORE INSERT): pull authoritative price from gardener_services
CREATE OR REPLACE FUNCTION public.enforce_booking_price()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  svc_price numeric(10,2);
  svc_gardener uuid;
BEGIN
  SELECT price, gardener_id INTO svc_price, svc_gardener
  FROM public.gardener_services WHERE id = NEW.service_id;
  IF svc_price IS NULL THEN
    RAISE EXCEPTION 'Invalid service_id';
  END IF;
  NEW.price := svc_price;
  NEW.gardener_id := svc_gardener;
  NEW.status := COALESCE(NEW.status, 'pending');
  -- Force new bookings to start as pending
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_booking_price_trg ON public.bookings;
CREATE TRIGGER enforce_booking_price_trg
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_price();

-- 3. Booking update guard: lock immutable fields and restrict status transitions
CREATE OR REPLACE FUNCTION public.guard_booking_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;
  -- Immutable identity/price fields for non-admins
  IF NEW.customer_id <> OLD.customer_id
     OR NEW.gardener_id <> OLD.gardener_id
     OR NEW.service_id <> OLD.service_id
     OR NEW.price <> OLD.price THEN
    RAISE EXCEPTION 'Cannot modify protected booking fields';
  END IF;
  -- Status transitions
  IF NEW.status <> OLD.status THEN
    IF auth.uid() = OLD.customer_id AND NEW.status NOT IN ('cancelled') THEN
      RAISE EXCEPTION 'Customers may only cancel bookings';
    END IF;
    IF auth.uid() = OLD.gardener_id AND NEW.status NOT IN ('confirmed','completed','cancelled','pending') THEN
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_booking_update_trg ON public.bookings;
CREATE TRIGGER guard_booking_update_trg
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_booking_update();

-- 4. Order items: overwrite unit_price and product_name from products on insert
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p_price numeric(10,2);
  p_name text;
  p_active boolean;
BEGIN
  SELECT price, name, is_active INTO p_price, p_name, p_active
  FROM public.products WHERE id = NEW.product_id;
  IF p_price IS NULL THEN
    RAISE EXCEPTION 'Invalid product_id';
  END IF;
  IF p_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  NEW.unit_price := p_price;
  NEW.product_name := p_name;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_order_item_price_trg ON public.order_items;
CREATE TRIGGER enforce_order_item_price_trg
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();

-- 5. Recalculate order total from items after each item insert/update/delete
CREATE OR REPLACE FUNCTION public.recalc_order_total()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  oid uuid := COALESCE(NEW.order_id, OLD.order_id);
  new_total numeric(10,2);
BEGIN
  SELECT COALESCE(SUM(unit_price * quantity), 0) INTO new_total
  FROM public.order_items WHERE order_id = oid;
  UPDATE public.orders SET total = new_total WHERE id = oid;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS recalc_order_total_trg ON public.order_items;
CREATE TRIGGER recalc_order_total_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_order_total();

-- 6. Force new orders to start with total=0 and status=pending; lock customer_id on update for non-admins
CREATE OR REPLACE FUNCTION public.enforce_order_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.total := 0;
  NEW.status := 'pending';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_order_insert_trg ON public.orders;
CREATE TRIGGER enforce_order_insert_trg
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_insert();
