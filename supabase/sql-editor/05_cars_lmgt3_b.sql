insert into public.cars (id, slug, name, game_code, season, manufacturer_id, car_class_id)
values
  ('ca8d20e0-eb87-44d4-8136-4a2a5e39c023', 'lexus-rc-f-lmgt3', 'Lexus RC F LMGT3', null, '2025 WEC', (select id from public.manufacturers where slug = 'lexus'), (select id from public.car_classes where slug = 'lmgt3')),
  ('d25b4f3c-1a22-48c7-bb7e-c5d7c61e4424', 'mclaren-720s-lmgt3-evo', 'McLaren 720S LMGT3 Evo', null, '2025 WEC', (select id from public.manufacturers where slug = 'mclaren'), (select id from public.car_classes where slug = 'lmgt3')),
  ('af2c5735-e2f6-4e79-a308-e346b4b4ab25', 'mercedes-amg-lmgt3-evo', 'Mercedes-AMG LMGT3 Evo', null, '2025 WEC', (select id from public.manufacturers where slug = 'mercedes-amg'), (select id from public.car_classes where slug = 'lmgt3')),
  ('b47e7123-8fb8-4790-8d98-cc53815a4626', 'porsche-911-gt3-r-lmgt3', 'Porsche 911 GT3 R LMGT3', null, '2024 WEC', (select id from public.manufacturers where slug = 'porsche'), (select id from public.car_classes where slug = 'lmgt3'))
on conflict (slug) do update
set
  name = excluded.name,
  game_code = excluded.game_code,
  season = excluded.season,
  manufacturer_id = excluded.manufacturer_id,
  car_class_id = excluded.car_class_id;
