insert into public.tracks (id, slug, name, country_code, city, official_name, is_dlc)
values
  ('6a5e18d3-c595-4766-9b6a-6c4c33f93e07', 'spa-francorchamps', 'Spa-Francorchamps', 'BE', 'Stavelot', 'Circuit de Spa-Francorchamps', false),
  ('c759c9b1-844e-4be5-85cb-b8db95564208', 'imola', 'Imola', 'IT', 'Imola', 'Autodromo Internazionale Enzo e Dino Ferrari', true),
  ('a3206b1c-fd6e-4a3f-822e-3b4cc040ab09', 'interlagos', 'Interlagos', 'BR', 'Sao Paulo', 'Autodromo Jose Carlos Pace', true),
  ('130e1fe2-d526-4b73-908d-9b969ab96510', 'circuit-of-the-americas', 'Circuit of the Americas', 'US', 'Austin', 'Circuit of the Americas', true),
  ('7e5d0d02-1bc8-4d8a-949c-f0a668b6d211', 'lusail-international-circuit', 'Lusail International Circuit', 'QA', 'Lusail', 'Lusail International Circuit', true)
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  city = excluded.city,
  official_name = excluded.official_name,
  is_dlc = excluded.is_dlc;
