insert into public.tracks (id, slug, name, country_code, city, official_name, is_dlc)
values
  ('611c0c6e-198a-47ed-bc17-858219666101', 'algarve-international-circuit', 'Algarve International Circuit', 'PT', 'Portimao', 'Autodromo Internacional do Algarve', false),
  ('404a0b13-7b20-47da-92d7-1c0b17db7b02', 'bahrain-international-circuit', 'Bahrain International Circuit', 'BH', 'Sakhir', 'Bahrain International Circuit', false),
  ('b9b7763b-d860-4f11-8952-d3faab2e4703', 'circuit-de-la-sarthe', 'Circuit de la Sarthe', 'FR', 'Le Mans', 'Circuit des 24 Heures du Mans', false),
  ('4c314d56-a251-49dd-b452-846a9a9e1e04', 'fuji-international-speedway', 'Fuji International Speedway', 'JP', 'Oyama', 'Fuji International Speedway', false),
  ('00d2e0e2-f97b-4ba7-9cd8-72bcc4e0b505', 'monza', 'Monza', 'IT', 'Monza', 'Autodromo Nazionale Monza', false),
  ('a040ebe6-8bac-404a-a2cf-61e6a696fa06', 'sebring', 'Sebring', 'US', 'Sebring', 'Sebring International Raceway', false)
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  city = excluded.city,
  official_name = excluded.official_name,
  is_dlc = excluded.is_dlc;
