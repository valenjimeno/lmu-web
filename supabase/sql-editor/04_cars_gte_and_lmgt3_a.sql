insert into public.cars (id, slug, name, game_code, season, manufacturer_id, car_class_id)
values
  ('aa9bcaaa-5108-4e84-b6a9-d2e06556c914', 'aston-martin-vantage-gte', 'Aston Martin Vantage GTE', null, '2023 WEC', (select id from public.manufacturers where slug = 'aston-martin'), (select id from public.car_classes where slug = 'gte')),
  ('8e4b99d5-3a61-470f-98a7-06b4086bfb15', 'chevrolet-corvette-c8-r', 'Chevrolet Corvette C8.R', null, '2023 WEC', (select id from public.manufacturers where slug = 'chevrolet'), (select id from public.car_classes where slug = 'gte')),
  ('4f247823-4b6d-4293-8e62-d0c95c184b16', 'ferrari-488-gte-evo', 'Ferrari 488 GTE Evo', null, '2023 WEC', (select id from public.manufacturers where slug = 'ferrari'), (select id from public.car_classes where slug = 'gte')),
  ('08e5ea20-d081-4cbc-961a-16d2448ba217', 'porsche-911-rsr-19', 'Porsche 911 RSR-19', null, '2023 WEC', (select id from public.manufacturers where slug = 'porsche'), (select id from public.car_classes where slug = 'gte')),
  ('96af244d-ce39-4f4c-bb86-7819fc2d3018', 'aston-martin-vantage-amr-lmgt3-evo', 'Aston Martin Vantage AMR LMGT3 Evo', null, '2025 WEC', (select id from public.manufacturers where slug = 'aston-martin'), (select id from public.car_classes where slug = 'lmgt3')),
  ('9e5f6ba1-c96d-4364-b31c-5b0307836819', 'bmw-m4-lmgt3', 'BMW M4 LMGT3', null, '2024 WEC', (select id from public.manufacturers where slug = 'bmw'), (select id from public.car_classes where slug = 'lmgt3')),
  ('2c2b39fd-1cb7-4e2e-8e20-5685d3921920', 'chevrolet-corvette-z06-lmgt3-r', 'Chevrolet Corvette Z06 LMGT3.R', null, '2024 WEC', (select id from public.manufacturers where slug = 'chevrolet'), (select id from public.car_classes where slug = 'lmgt3')),
  ('33501985-8e79-4b38-be7c-57da8d226d21', 'ferrari-296-lmgt3', 'Ferrari 296 LMGT3', null, '2024 WEC', (select id from public.manufacturers where slug = 'ferrari'), (select id from public.car_classes where slug = 'lmgt3')),
  ('dd714ea8-a20b-4cb1-a28f-076b59430522', 'ford-mustang-lmgt3', 'Ford Mustang LMGT3', null, '2025 WEC', (select id from public.manufacturers where slug = 'ford'), (select id from public.car_classes where slug = 'lmgt3'))
on conflict (slug) do update
set
  name = excluded.name,
  game_code = excluded.game_code,
  season = excluded.season,
  manufacturer_id = excluded.manufacturer_id,
  car_class_id = excluded.car_class_id;
