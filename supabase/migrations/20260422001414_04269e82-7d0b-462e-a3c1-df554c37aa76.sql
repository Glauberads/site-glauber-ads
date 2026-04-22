drop policy if exists "Public can insert leads" on public.leads;
create policy "Public can insert leads"
on public.leads for insert
to anon, authenticated
with check (
  length(trim(nome)) between 2 and 100
  and length(regexp_replace(whatsapp, '\D', '', 'g')) between 10 and 15
);