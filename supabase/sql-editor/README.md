# SQL Editor blocks

Run these files in this order from the Supabase SQL Editor:

Optional full reset before reseeding:

1. `00_reset_catalog_and_dependent_data.sql`

Seed order:

1. `00_expand_catalog_seed_fields.sql`
2. `01_car_classes.sql`
3. `02_manufacturers.sql`
4. `03_cars_hypercar_lmp2.sql`
5. `04_cars_gte_and_lmgt3_a.sql`
6. `05_cars_lmgt3_b.sql`
7. `06_tracks_a.sql`
8. `07_tracks_b.sql`

Quick verification:

```sql
select count(*) from public.car_classes;
select count(*) from public.manufacturers;
select count(*) from public.cars;
select count(*) from public.tracks;
select count(*) from public.setups;
select count(*) from public.setup_favorites;
```

Expected counts:

- `car_classes`: `4`
- `manufacturers`: `17`
- `cars`: `26`
- `tracks`: `11`
- `setups`: `0`
- `setup_favorites`: `0`
