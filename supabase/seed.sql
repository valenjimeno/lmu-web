insert into public.car_classes (id, slug, name)
values
  ('8c05234c-2e6f-42e1-b807-bab5e4d12101', 'hypercar', 'Hypercar'),
  ('6d60afc1-8828-43a4-a084-e5856b365202', 'lmgt3', 'LMGT3'),
  ('1158fcd9-a98a-4efd-a0ea-9c67f7152303', 'lmp2', 'LMP2'),
  ('0729b9b5-ee6b-4df3-a987-6a9d6750a504', 'gte', 'GTE')
on conflict (slug) do update
set name = excluded.name;

insert into public.manufacturers (id, slug, name)
values
  ('1f4d5737-302d-43b2-95f2-ad1a73f0d101', 'alpine', 'Alpine'),
  ('640b5711-1af6-4a3a-9f6a-a918a2132d02', 'aston-martin', 'Aston Martin'),
  ('188f3f25-4240-46f2-a52a-6d2af424a303', 'bmw', 'BMW'),
  ('d4c404d5-cc9d-4d92-a3fd-fd7841659004', 'cadillac', 'Cadillac'),
  ('9f099371-155d-4e39-89a7-8489911eee05', 'chevrolet', 'Chevrolet'),
  ('0499f832-c3e0-45f9-a548-8e8a4c791f06', 'ferrari', 'Ferrari'),
  ('9f643a1a-ef00-4ae9-803b-e7312a786007', 'ford', 'Ford'),
  ('d225d3e8-ff80-4e60-a8ba-857289f7a908', 'glickenhaus', 'Glickenhaus'),
  ('be210064-15b0-46d3-b859-4f8e30ad9209', 'isotta-fraschini', 'Isotta Fraschini'),
  ('22144e71-843d-46e4-a42b-0b0949456a10', 'lexus', 'Lexus'),
  ('40e5f254-c13d-4a0a-b267-2fb110184a11', 'mclaren', 'McLaren'),
  ('e5a55f31-93cb-47fa-a0bc-c8154d395112', 'mercedes-amg', 'Mercedes-AMG'),
  ('638a28af-c9af-48a1-8a8c-c39e6f74cc13', 'oreca', 'Oreca'),
  ('f34a1d92-4810-4864-8633-d169d0a59e14', 'peugeot', 'Peugeot'),
  ('0b70e0e0-4d63-492d-83b4-c420b4036315', 'porsche', 'Porsche'),
  ('5a69c518-53c8-4df6-bd29-d22d6479e016', 'toyota', 'Toyota'),
  ('6f89f0b3-1b77-431e-a44c-bd15fbb35d17', 'vanwall', 'Vanwall')
on conflict (slug) do update
set name = excluded.name;

insert into public.cars (id, slug, name, game_code, season, manufacturer_id, car_class_id)
values
  (
    'e7b8b302-4b1a-4057-a4a0-219af152d101',
    'alpine-a424-lmdh',
    'Alpine A424 LMDh',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'alpine'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    'a79f087b-4590-4cec-b6ba-07cde9fa1602',
    'aston-martin-valkyrie-amr-lmh',
    'Aston Martin Valkyrie AMR LMH',
    null,
    '2025 WEC',
    (select id from public.manufacturers where slug = 'aston-martin'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    'cc1d264e-7df4-4d19-b133-388e6b7da303',
    'bmw-m-hybrid-v8-lmdh',
    'BMW M Hybrid V8 LMDh',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'bmw'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '50d5f5e2-7e44-4498-9a0e-a160e6205104',
    'cadillac-v-series-r-lmdh',
    'Cadillac V-Series.R LMDh',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'cadillac'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '8f3954bd-e776-449b-a2f8-727e6f48ce05',
    'ferrari-499p-lmh',
    'Ferrari 499P LMH',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'ferrari'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '9e299e2d-e4f7-4d5d-b2a1-30a4689d4d06',
    'glickenhaus-scg-007-lmh',
    'Glickenhaus SCG 007 LMH',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'glickenhaus'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '9608c849-6669-48b8-bd7a-926a2952b107',
    'isotta-fraschini-tipo-6-c',
    'Isotta Fraschini Tipo 6-C',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'isotta-fraschini'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '08b0a067-b7ab-413f-bd81-79a0a7cfef08',
    'peugeot-9x8-lmh',
    'Peugeot 9X8 LMH',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'peugeot'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '39d5cf86-3e21-4085-b45c-4a79f4c6fb09',
    'peugeot-9x8-2024-lmh',
    'Peugeot 9X8 2024 LMH',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'peugeot'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    'dca4bdba-8170-4de0-b747-cc4d8b6fc410',
    'porsche-963-lmdh',
    'Porsche 963 LMDh',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'porsche'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    'f4a01746-bd12-4a62-a46c-99d660f6f611',
    'toyota-gr010-hybrid-lmh',
    'Toyota GR010-Hybrid LMH',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'toyota'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    'd632f115-33f5-4a67-97e7-074717203912',
    'vanwall-vandervell-680-lmh',
    'Vanwall Vandervell 680 LMH',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'vanwall'),
    (select id from public.car_classes where slug = 'hypercar')
  ),
  (
    '6616d7cc-e8d4-4d11-92a9-8ab484c4ca13',
    'oreca-07-gibson',
    'Oreca 07 Gibson',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'oreca'),
    (select id from public.car_classes where slug = 'lmp2')
  ),
  (
    'aa9bcaaa-5108-4e84-b6a9-d2e06556c914',
    'aston-martin-vantage-gte',
    'Aston Martin Vantage GTE',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'aston-martin'),
    (select id from public.car_classes where slug = 'gte')
  ),
  (
    '8e4b99d5-3a61-470f-98a7-06b4086bfb15',
    'chevrolet-corvette-c8-r',
    'Chevrolet Corvette C8.R',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'chevrolet'),
    (select id from public.car_classes where slug = 'gte')
  ),
  (
    '4f247823-4b6d-4293-8e62-d0c95c184b16',
    'ferrari-488-gte-evo',
    'Ferrari 488 GTE Evo',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'ferrari'),
    (select id from public.car_classes where slug = 'gte')
  ),
  (
    '08e5ea20-d081-4cbc-961a-16d2448ba217',
    'porsche-911-rsr-19',
    'Porsche 911 RSR-19',
    null,
    '2023 WEC',
    (select id from public.manufacturers where slug = 'porsche'),
    (select id from public.car_classes where slug = 'gte')
  ),
  (
    '96af244d-ce39-4f4c-bb86-7819fc2d3018',
    'aston-martin-vantage-amr-lmgt3-evo',
    'Aston Martin Vantage AMR LMGT3 Evo',
    null,
    '2025 WEC',
    (select id from public.manufacturers where slug = 'aston-martin'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    '9e5f6ba1-c96d-4364-b31c-5b0307836819',
    'bmw-m4-lmgt3',
    'BMW M4 LMGT3',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'bmw'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    '2c2b39fd-1cb7-4e2e-8e20-5685d3921920',
    'chevrolet-corvette-z06-lmgt3-r',
    'Chevrolet Corvette Z06 LMGT3.R',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'chevrolet'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    '33501985-8e79-4b38-be7c-57da8d226d21',
    'ferrari-296-lmgt3',
    'Ferrari 296 LMGT3',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'ferrari'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    'dd714ea8-a20b-4cb1-a28f-076b59430522',
    'ford-mustang-lmgt3',
    'Ford Mustang LMGT3',
    null,
    '2025 WEC',
    (select id from public.manufacturers where slug = 'ford'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    'ca8d20e0-eb87-44d4-8136-4a2a5e39c023',
    'lexus-rc-f-lmgt3',
    'Lexus RC F LMGT3',
    null,
    '2025 WEC',
    (select id from public.manufacturers where slug = 'lexus'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    'd25b4f3c-1a22-48c7-bb7e-c5d7c61e4424',
    'mclaren-720s-lmgt3-evo',
    'McLaren 720S LMGT3 Evo',
    null,
    '2025 WEC',
    (select id from public.manufacturers where slug = 'mclaren'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    'af2c5735-e2f6-4e79-a308-e346b4b4ab25',
    'mercedes-amg-lmgt3-evo',
    'Mercedes-AMG LMGT3 Evo',
    null,
    '2025 WEC',
    (select id from public.manufacturers where slug = 'mercedes-amg'),
    (select id from public.car_classes where slug = 'lmgt3')
  ),
  (
    'b47e7123-8fb8-4790-8d98-cc53815a4626',
    'porsche-911-gt3-r-lmgt3',
    'Porsche 911 GT3 R LMGT3',
    null,
    '2024 WEC',
    (select id from public.manufacturers where slug = 'porsche'),
    (select id from public.car_classes where slug = 'lmgt3')
  )
on conflict (slug) do update
set
  name = excluded.name,
  game_code = excluded.game_code,
  season = excluded.season,
  manufacturer_id = excluded.manufacturer_id,
  car_class_id = excluded.car_class_id;

insert into public.tracks (id, slug, name, country_code, city, official_name, is_dlc)
values
  (
    '611c0c6e-198a-47ed-bc17-858219666101',
    'algarve-international-circuit',
    'Algarve International Circuit',
    'PT',
    'Portimao',
    'Autodromo Internacional do Algarve',
    false
  ),
  (
    '404a0b13-7b20-47da-92d7-1c0b17db7b02',
    'bahrain-international-circuit',
    'Bahrain International Circuit',
    'BH',
    'Sakhir',
    'Bahrain International Circuit',
    false
  ),
  (
    'b9b7763b-d860-4f11-8952-d3faab2e4703',
    'circuit-de-la-sarthe',
    'Circuit de la Sarthe',
    'FR',
    'Le Mans',
    'Circuit des 24 Heures du Mans',
    false
  ),
  (
    '4c314d56-a251-49dd-b452-846a9a9e1e04',
    'fuji-international-speedway',
    'Fuji International Speedway',
    'JP',
    'Oyama',
    'Fuji International Speedway',
    false
  ),
  (
    '00d2e0e2-f97b-4ba7-9cd8-72bcc4e0b505',
    'monza',
    'Monza',
    'IT',
    'Monza',
    'Autodromo Nazionale Monza',
    false
  ),
  (
    'a040ebe6-8bac-404a-a2cf-61e6a696fa06',
    'sebring',
    'Sebring',
    'US',
    'Sebring',
    'Sebring International Raceway',
    false
  ),
  (
    '6a5e18d3-c595-4766-9b6a-6c4c33f93e07',
    'spa-francorchamps',
    'Spa-Francorchamps',
    'BE',
    'Stavelot',
    'Circuit de Spa-Francorchamps',
    false
  ),
  (
    'c759c9b1-844e-4be5-85cb-b8db95564208',
    'imola',
    'Imola',
    'IT',
    'Imola',
    'Autodromo Internazionale Enzo e Dino Ferrari',
    true
  ),
  (
    'a3206b1c-fd6e-4a3f-822e-3b4cc040ab09',
    'interlagos',
    'Interlagos',
    'BR',
    'Sao Paulo',
    'Autodromo Jose Carlos Pace',
    true
  ),
  (
    '130e1fe2-d526-4b73-908d-9b969ab96510',
    'circuit-of-the-americas',
    'Circuit of the Americas',
    'US',
    'Austin',
    'Circuit of the Americas',
    true
  ),
  (
    '7e5d0d02-1bc8-4d8a-949c-f0a668b6d211',
    'lusail-international-circuit',
    'Lusail International Circuit',
    'QA',
    'Lusail',
    'Lusail International Circuit',
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  city = excluded.city,
  official_name = excluded.official_name,
  is_dlc = excluded.is_dlc;
