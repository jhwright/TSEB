-- Revert gig dates to original spreadsheet values
update gigs set gig_date = '2025-09-04' where id = 'c0000001-0000-0000-0000-000000000001'; -- Fairmont weekly
update gigs set gig_date = '2025-09-04' where id = 'c0000001-0000-0000-0000-000000000002'; -- Kaiser NICU weekly
update gigs set gig_date = '2025-09-04' where id = 'c0000001-0000-0000-0000-000000000003'; -- Mercy weekly
update gigs set gig_date = '2025-09-01' where id = 'c0000001-0000-0000-0000-000000000004'; -- PG Team A monthly
update gigs set gig_date = '2025-09-15' where id = 'c0000001-0000-0000-0000-000000000005'; -- PG Team B monthly
update gigs set gig_date = '2025-09-01' where id = 'c0000001-0000-0000-0000-000000000006'; -- Lakeside 2x/month
