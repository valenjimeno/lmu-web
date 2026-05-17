insert into public.car_classes (id, slug, name)
values
  ('8c05234c-2e6f-42e1-b807-bab5e4d12101', 'hypercar', 'Hypercar'),
  ('6d60afc1-8828-43a4-a084-e5856b365202', 'lmgt3', 'LMGT3'),
  ('1158fcd9-a98a-4efd-a0ea-9c67f7152303', 'lmp2', 'LMP2'),
  ('0729b9b5-ee6b-4df3-a987-6a9d6750a504', 'gte', 'GTE')
on conflict (slug) do update
set name = excluded.name;
