insert into public.cars (id, slug, name, game_code, season, manufacturer_id, car_class_id)
values
  ('e7b8b302-4b1a-4057-a4a0-219af152d101', 'alpine-a424-lmdh', 'Alpine A424 LMDh', null, '2024 WEC', (select id from public.manufacturers where slug = 'alpine'), (select id from public.car_classes where slug = 'hypercar')),
  ('a79f087b-4590-4cec-b6ba-07cde9fa1602', 'aston-martin-valkyrie-amr-lmh', 'Aston Martin Valkyrie AMR LMH', null, '2025 WEC', (select id from public.manufacturers where slug = 'aston-martin'), (select id from public.car_classes where slug = 'hypercar')),
  ('cc1d264e-7df4-4d19-b133-388e6b7da303', 'bmw-m-hybrid-v8-lmdh', 'BMW M Hybrid V8 LMDh', null, '2024 WEC', (select id from public.manufacturers where slug = 'bmw'), (select id from public.car_classes where slug = 'hypercar')),
  ('50d5f5e2-7e44-4498-9a0e-a160e6205104', 'cadillac-v-series-r-lmdh', 'Cadillac V-Series.R LMDh', null, '2023 WEC', (select id from public.manufacturers where slug = 'cadillac'), (select id from public.car_classes where slug = 'hypercar')),
  ('8f3954bd-e776-449b-a2f8-727e6f48ce05', 'ferrari-499p-lmh', 'Ferrari 499P LMH', null, '2023 WEC', (select id from public.manufacturers where slug = 'ferrari'), (select id from public.car_classes where slug = 'hypercar')),
  ('9e299e2d-e4f7-4d5d-b2a1-30a4689d4d06', 'glickenhaus-scg-007-lmh', 'Glickenhaus SCG 007 LMH', null, '2023 WEC', (select id from public.manufacturers where slug = 'glickenhaus'), (select id from public.car_classes where slug = 'hypercar')),
  ('9608c849-6669-48b8-bd7a-926a2952b107', 'isotta-fraschini-tipo-6-c', 'Isotta Fraschini Tipo 6-C', null, '2024 WEC', (select id from public.manufacturers where slug = 'isotta-fraschini'), (select id from public.car_classes where slug = 'hypercar')),
  ('08b0a067-b7ab-413f-bd81-79a0a7cfef08', 'peugeot-9x8-lmh', 'Peugeot 9X8 LMH', null, '2023 WEC', (select id from public.manufacturers where slug = 'peugeot'), (select id from public.car_classes where slug = 'hypercar')),
  ('39d5cf86-3e21-4085-b45c-4a79f4c6fb09', 'peugeot-9x8-2024-lmh', 'Peugeot 9X8 2024 LMH', null, '2024 WEC', (select id from public.manufacturers where slug = 'peugeot'), (select id from public.car_classes where slug = 'hypercar')),
  ('dca4bdba-8170-4de0-b747-cc4d8b6fc410', 'porsche-963-lmdh', 'Porsche 963 LMDh', null, '2023 WEC', (select id from public.manufacturers where slug = 'porsche'), (select id from public.car_classes where slug = 'hypercar')),
  ('f4a01746-bd12-4a62-a46c-99d660f6f611', 'toyota-gr010-hybrid-lmh', 'Toyota GR010-Hybrid LMH', null, '2023 WEC', (select id from public.manufacturers where slug = 'toyota'), (select id from public.car_classes where slug = 'hypercar')),
  ('d632f115-33f5-4a67-97e7-074717203912', 'vanwall-vandervell-680-lmh', 'Vanwall Vandervell 680 LMH', null, '2023 WEC', (select id from public.manufacturers where slug = 'vanwall'), (select id from public.car_classes where slug = 'hypercar')),
  ('6616d7cc-e8d4-4d11-92a9-8ab484c4ca13', 'oreca-07-gibson', 'Oreca 07 Gibson', null, '2023 WEC', (select id from public.manufacturers where slug = 'oreca'), (select id from public.car_classes where slug = 'lmp2'))
on conflict (slug) do update
set
  name = excluded.name,
  game_code = excluded.game_code,
  season = excluded.season,
  manufacturer_id = excluded.manufacturer_id,
  car_class_id = excluded.car_class_id;
