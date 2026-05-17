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
