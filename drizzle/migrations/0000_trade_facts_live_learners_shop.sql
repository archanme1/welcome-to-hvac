CREATE TABLE public.trade_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  explanation text NOT NULL,
  example text,
  category text NOT NULL DEFAULT 'HVAC',
  learn_more_href text,
  learn_more_label text,
  scheduled_date date,
  month smallint CHECK (month BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','disabled')),
  source_note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trade_facts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trade_facts TO authenticated;
GRANT ALL ON public.trade_facts TO service_role;
ALTER TABLE public.trade_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved facts are public" ON public.trade_facts FOR SELECT TO anon, authenticated USING (status = 'approved' OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage facts" ON public.trade_facts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trade_facts_updated_at BEFORE UPDATE ON public.trade_facts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.todays_trade_fact()
RETURNS SETOF public.trade_facts LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := (now() AT TIME ZONE 'America/Toronto')::date; n int; pool int;
BEGIN
  RETURN QUERY SELECT * FROM trade_facts WHERE status='approved' AND scheduled_date = d LIMIT 1;
  IF FOUND THEN RETURN; END IF;
  SELECT count(*) INTO pool FROM trade_facts WHERE status='approved' AND scheduled_date IS NULL AND (month IS NULL OR month = extract(month FROM d));
  IF pool = 0 THEN RETURN; END IF;
  n := (d - date '2026-01-01') % pool;
  IF n < 0 THEN n := n + pool; END IF;
  RETURN QUERY SELECT * FROM trade_facts WHERE status='approved' AND scheduled_date IS NULL AND (month IS NULL OR month = extract(month FROM d))
    ORDER BY md5(id::text) OFFSET n LIMIT 1;
END $$;
GRANT EXECUTE ON FUNCTION public.todays_trade_fact() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.live_learner_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(DISTINCT user_id) FROM visitor_presence WHERE user_id IS NOT NULL AND last_seen > now() - interval '2 minutes')::int
       + (SELECT count(*) FROM visitor_presence WHERE user_id IS NULL AND last_seen > now() - interval '2 minutes')::int
$$;
GRANT EXECUTE ON FUNCTION public.live_learner_count() TO anon, authenticated;

INSERT INTO public.app_settings (key, value) VALUES ('shop_url', '"https://store.welcometohvac.com/"'::jsonb) ON CONFLICT (key) DO NOTHING;
CREATE OR REPLACE FUNCTION public.shop_url()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT value #>> '{}' FROM app_settings WHERE key='shop_url'), 'https://store.welcometohvac.com/')
$$;
GRANT EXECUTE ON FUNCTION public.shop_url() TO anon, authenticated;

INSERT INTO public.trade_facts (headline, explanation, example, category, learn_more_href, learn_more_label, month, status) VALUES
('What does "1 ton" of air conditioning actually mean?','A ton of cooling is 12,000 BTU per hour — the heat needed to melt one short ton (2,000 lb) of ice over 24 hours. It is a rate of heat removal, not a weight of equipment.','A 3-ton system removes about 36,000 BTU/h, roughly 10.5 kW of heat.','Air Conditioning','/calculators/btu-to-kw','Convert BTU/h, tons and kW',NULL,'approved'),
('Why can a heat pump pull heat out of freezing air?','Outdoor air below 0 °C still holds heat energy. The heat pump''s outdoor coil runs colder than the air around it, so heat flows into the refrigerant, which the compressor then raises to a useful temperature indoors.','At -10 °C outdoors, the outdoor coil may be running near -20 °C so heat still moves into it.','Heat Pumps','/calculators/heat-pump-cop','Heat pump COP calculator',1,'approved'),
('A heat pump can deliver more heat than the electricity it uses','Coefficient of performance (COP) compares heat delivered to electrical energy used. Electric resistance heat has a COP of 1; heat pumps commonly run well above 1 because they move heat rather than make it.','At COP 3, 1 kWh of electricity delivers about 3 kWh of heat.','Heat Pumps','/calculators/heat-pump-cop','Heat pump COP calculator',2,'approved'),
('Superheat and subcooling measure opposite ends of the coil','Superheat is how far vapour is above its saturation temperature (checked at the suction line). Subcooling is how far liquid is below its saturation temperature (checked at the liquid line).','Suction line 55 °F with 45 °F saturation = 10 °F superheat.','Refrigeration','/calculators/superheat','Superheat calculator',NULL,'approved'),
('Why does a run capacitor help a PSC motor?','A run capacitor shifts the current in the start winding out of phase with the run winding, creating a rotating magnetic field that lets a single-phase motor start and run efficiently.','A weak capacitor can leave a condenser fan humming, running hot, or spinning slowly.','Electrical','/search?q=capacitor','Read about capacitors',NULL,'approved'),
('Doubling R-value halves conductive heat loss','Heat loss through an assembly is proportional to U = 1/R. Going from R-10 to R-20 cuts conductive loss through that area in half — but the next doubling saves less absolute energy.','R-10 to R-20 saves 50%; R-20 to R-40 saves another 25% of the original.','Building Science','/calculators/r-value-rsi','R-value ↔ RSI converter',11,'approved'),
('Combustion air is about more than burning fuel','Fuel-burning appliances need air for combustion and for proper venting draft. Starving an appliance of air can cause incomplete combustion and carbon monoxide.','Tight, renovated houses and closed mechanical rooms are classic places to check.','Combustion','/search?q=combustion%20air','Read about combustion air',10,'approved'),
('Static pressure is like blood pressure for duct systems','Total external static pressure tells you how hard the blower is working against the ducts, filter and coil. High readings usually mean reduced airflow.','A restrictive filter alone can add a significant share of a blower''s rated static.','Airflow','/calculators/fan-affinity','Fan affinity laws',NULL,'approved'),
('Fan power rises with the cube of speed','By the fan affinity laws, airflow scales with speed, pressure with speed squared, and power with speed cubed.','Raising fan speed 10% needs about 33% more power.','Airflow','/calculators/fan-affinity','Fan affinity calculator',NULL,'approved'),
('Latent heat changes state without changing temperature','Boiling refrigerant in an evaporator absorbs large amounts of heat while staying at saturation temperature. That is why most refrigeration capacity comes from phase change.','Water needs about 970 BTU per pound to boil at atmospheric pressure, versus 1 BTU per pound per °F to warm.','Refrigeration','/calculators/sensible-heat','Sensible heat calculator',NULL,'approved'),
('A 500 micron vacuum is a tiny fraction of atmosphere','Atmospheric pressure is about 760,000 microns of mercury. A deep evacuation to 500 microns removes air and helps boil off moisture.','500 microns ≈ 0.0097 psia.','Refrigeration','/calculators/unit-converter','Unit converter (vacuum)',NULL,'approved'),
('Three-phase power uses √3, not 3','For balanced three-phase loads, P = √3 × V × I × PF. The 1.732 factor comes from the 120° spacing of the phases.','208 V × 10 A × 1.732 ≈ 3.6 kVA.','Electrical','/calculators/three-phase-power','Three-phase power calculator',NULL,'approved'),
('Dew point tells you where condensation starts','Any surface colder than the air''s dew point will collect moisture. That is why uninsulated cold ducts sweat in humid attics.','At 24 °C and 60% RH, the dew point is about 15.8 °C.','Building Science','/calculators/dew-point','Dew point calculator',7,'approved'),
('Voltage drop wastes power and stresses motors','Long conductor runs add resistance. Excess voltage drop can make motors draw more current and run hotter.','Many designers keep branch-circuit drop near 3% as a guideline — always confirm with your electrical code.','Electrical','/calculators/voltage-drop','Voltage drop calculator',NULL,'approved'),
('Temperature rise tells you if a furnace has enough airflow','Manufacturers list an allowable temperature rise range on the rating plate. Rise above that range usually points to low airflow.','Return 68 °F, supply 128 °F → 60 °F rise. Compare it with the rating plate range.','Heating','/calculators/temperature-rise','Temperature rise calculator',12,'approved'),
('Why heat pumps defrost in winter','When the outdoor coil runs below freezing, moisture from the air frosts on it. Defrost briefly reverses the cycle to melt the frost so the coil can keep absorbing heat.','Steam rising from an outdoor unit in winter is usually normal defrost.','Heat Pumps','/search?q=defrost','Read about defrost',1,'approved'),
('Air changes per hour depend on volume, not floor area','ACH = CFM × 60 ÷ room volume in cubic feet. Two rooms with the same floor area but different ceiling heights need different airflow for the same ACH.','100 CFM in a 1,000 ft³ room = 6 ACH.','Ventilation','/calculators/air-changes','Air changes per hour',NULL,'approved'),
('Ohm''s law: one equation, many field checks','V = I × R links voltage, current and resistance. Combined with P = V × I, it lets you check heaters, coils and wiring from a couple of readings.','A 240 V heating element measuring 24 Ω draws 10 A and about 2,400 W.','Electrical','/calculators/ohms-law','Ohm''s law calculator',NULL,'approved'),
('Thermal bridging lets heat bypass insulation','Wood or steel framing conducts heat faster than the insulation between it, so a wall''s whole-assembly R-value is lower than the cavity insulation rating.','Steel studs can significantly reduce a wall''s effective R-value without continuous exterior insulation.','Building Science','/search?q=insulation','Read about insulation',NULL,'approved'),
('A plumbing trap is a water seal against sewer gas','The water held in a P-trap blocks sewer gases from entering the building. Venting keeps that seal from being siphoned away.','A rarely used floor drain can dry out and let odours in.','Plumbing',NULL,NULL,NULL,'approved'),
('Ground-source heat pumps use the earth as a steady reservoir','A few metres below the surface, ground temperature stays fairly steady year-round, giving geothermal heat pumps a more stable source than outdoor air.','In much of southern Canada, ground temperature at depth sits near the area''s average annual air temperature.','Renewable Energy','/calculators/heat-pump-cop','Heat pump COP calculator',NULL,'approved'),
('Sensible heat formula for air: 1.08 × CFM × ΔT','For standard air, sensible heat in BTU/h ≈ 1.08 × CFM × temperature difference in °F. The 1.08 combines air density, specific heat and 60 minutes.','1,000 CFM at a 20 °F ΔT ≈ 21,600 BTU/h.','HVAC Fundamentals','/calculators/sensible-heat','Sensible heat calculator',NULL,'approved'),
('Spring is the time to check cooling before the rush','Cleaning coils, checking capacitors and verifying airflow before the first hot week prevents many peak-season breakdowns.','A dirty condenser raises head pressure and power draw.','HVAC',NULL,NULL,5,'approved'),
('Relative humidity changes when air warms up','Warming air without adding moisture lowers its relative humidity. That is why heated winter indoor air feels dry.','Outdoor air at 0 °C and 80% RH warmed to 21 °C drops to roughly 20% RH.','Building Science','/calculators/dew-point','Dew point & humidity',2,'approved');
