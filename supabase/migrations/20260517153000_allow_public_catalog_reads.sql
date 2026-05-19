create policy "anon users can read manufacturers"
on public.manufacturers
for select
to anon
using (true);

create policy "anon users can read car classes"
on public.car_classes
for select
to anon
using (true);

create policy "anon users can read cars"
on public.cars
for select
to anon
using (true);

create policy "anon users can read tracks"
on public.tracks
for select
to anon
using (true);
