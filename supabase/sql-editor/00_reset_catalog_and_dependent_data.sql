begin;

delete from public.setup_favorites;
delete from public.setups;
delete from public.cars;
delete from public.tracks;
delete from public.manufacturers;
delete from public.car_classes;

commit;
