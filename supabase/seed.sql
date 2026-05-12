insert into public.manufacturers (slug, name)
values
  ('bmw', 'BMW'),
  ('ferrari', 'Ferrari'),
  ('lamborghini', 'Lamborghini'),
  ('porsche', 'Porsche')
on conflict (slug) do update
set name = excluded.name;

insert into public.car_classes (slug, name)
values
  ('gt3', 'GT3'),
  ('gt4', 'GT4'),
  ('hypercar', 'Hypercar')
on conflict (slug) do update
set name = excluded.name;

insert into public.cars (slug, name, game_code, manufacturer_id, car_class_id)
values
  (
    'bmw-m4-gt3',
    'BMW M4 GT3',
    'BMW_M4_GT3',
    (select id from public.manufacturers where slug = 'bmw'),
    (select id from public.car_classes where slug = 'gt3')
  ),
  (
    'ferrari-296-gt3',
    'Ferrari 296 GT3',
    'FERRARI_296_GT3',
    (select id from public.manufacturers where slug = 'ferrari'),
    (select id from public.car_classes where slug = 'gt3')
  ),
  (
    'lamborghini-huracan-gt3-evo2',
    'Lamborghini Huracan GT3 EVO2',
    'LAMBORGHINI_HURACAN_GT3_EVO2',
    (select id from public.manufacturers where slug = 'lamborghini'),
    (select id from public.car_classes where slug = 'gt3')
  ),
  (
    'porsche-911-gt3-r-992',
    'Porsche 911 GT3 R (992)',
    'PORSCHE_911_GT3_R_992',
    (select id from public.manufacturers where slug = 'porsche'),
    (select id from public.car_classes where slug = 'gt3')
  )
on conflict (slug) do update
set
  name = excluded.name,
  game_code = excluded.game_code,
  manufacturer_id = excluded.manufacturer_id,
  car_class_id = excluded.car_class_id;

insert into public.tracks (slug, name, country_code)
values
  ('monza', 'Monza', 'IT'),
  ('spa-francorchamps', 'Spa-Francorchamps', 'BE'),
  ('imola', 'Imola', 'IT'),
  ('suzuka', 'Suzuka', 'JP'),
  ('silverstone', 'Silverstone', 'GB')
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code;
