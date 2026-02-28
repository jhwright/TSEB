-- TSEB Bedside Singing Manager - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- SINGERS (volunteers - first name only per TSEB convention)
-- ============================================================
create table singers (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  role text not null default 'singer' check (role in ('singer','outreacher','both')),
  availability text not null default 'available' check (availability in ('available','limited','unavailable')),
  preferred_days text,        -- e.g. "Tue, Thu"
  notes text,
  email text,                 -- for auth matching
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INSTITUTIONS (hospitals, hospices, nursing facilities, etc.)
-- ============================================================
create table institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  institution_type text check (institution_type in (
    'hospital','hospice','nursing_snf','memory_care',
    'senior_center','nicu','retirement','other'
  )),
  address text,
  phone text,
  status text not null default 'outreach' check (status in (
    'active','outreach','in_conversation','site_visit','pending','previous','eliminated'
  )),
  pipeline_stage text default 'initial_contact' check (pipeline_stage in (
    'initial_contact','in_conversation','site_visit','active','on_hold','eliminated'
  )),
  elimination_reason text,    -- why eliminated, if applicable
  next_step text,
  next_step_due date,
  outreacher_id uuid references singers(id),
  recurrence text,            -- for active venues: 'weekly','biweekly','2x_month','monthly'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CONTACTS (people at institutions - supports multiple per institution)
-- ============================================================
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid not null references institutions(id) on delete cascade,
  first_name text,
  last_name text,
  job_title text,
  email text,
  phone text,
  is_primary boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG (outreach timeline entries)
-- ============================================================
create table activities (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid not null references institutions(id) on delete cascade,
  singer_id uuid references singers(id),        -- who did the outreach
  activity_type text not null check (activity_type in (
    'phone_call','voicemail','email_sent','email_received',
    'in_person','site_visit','first_sing','status_change','note'
  )),
  activity_date date not null default current_date,
  contact_person text,        -- who at the facility
  description text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- GIGS (scheduled singing visits)
-- ============================================================
create table gigs (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid not null references institutions(id) on delete cascade,
  gig_date date not null,
  gig_time time,
  recurrence text check (recurrence in ('one_time','weekly','biweekly','2x_month','monthly')),
  recurrence_end date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- GIG_SINGERS (which singers are assigned to a gig)
-- ============================================================
create table gig_singers (
  id uuid primary key default uuid_generate_v4(),
  gig_id uuid not null references gigs(id) on delete cascade,
  singer_id uuid not null references singers(id),
  is_anchor boolean default false,
  unique(gig_id, singer_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_institutions_status on institutions(status);
create index idx_institutions_pipeline on institutions(pipeline_stage);
create index idx_institutions_next_step_due on institutions(next_step_due);
create index idx_institutions_outreacher on institutions(outreacher_id);
create index idx_activities_institution on activities(institution_id);
create index idx_activities_date on activities(activity_date);
create index idx_gigs_date on gigs(gig_date);
create index idx_gigs_institution on gigs(institution_id);
create index idx_contacts_institution on contacts(institution_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_singers_updated before update on singers
  for each row execute function update_updated_at();
create trigger trg_institutions_updated before update on institutions
  for each row execute function update_updated_at();
create trigger trg_gigs_updated before update on gigs
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table singers enable row level security;
alter table institutions enable row level security;
alter table contacts enable row level security;
alter table activities enable row level security;
alter table gigs enable row level security;
alter table gig_singers enable row level security;

-- All authenticated users can read everything
create policy "Authenticated users can read singers" on singers for select to authenticated using (true);
create policy "Authenticated users can read institutions" on institutions for select to authenticated using (true);
create policy "Authenticated users can read contacts" on contacts for select to authenticated using (true);
create policy "Authenticated users can read activities" on activities for select to authenticated using (true);
create policy "Authenticated users can read gigs" on gigs for select to authenticated using (true);
create policy "Authenticated users can read gig_singers" on gig_singers for select to authenticated using (true);

-- All authenticated users can insert/update (volunteer trust model)
create policy "Authenticated users can insert singers" on singers for insert to authenticated with check (true);
create policy "Authenticated users can update singers" on singers for update to authenticated using (true);
create policy "Authenticated users can insert institutions" on institutions for insert to authenticated with check (true);
create policy "Authenticated users can update institutions" on institutions for update to authenticated using (true);
create policy "Authenticated users can insert contacts" on contacts for insert to authenticated with check (true);
create policy "Authenticated users can update contacts" on contacts for update to authenticated using (true);
create policy "Authenticated users can insert activities" on activities for insert to authenticated with check (true);
create policy "Authenticated users can insert gigs" on gigs for insert to authenticated with check (true);
create policy "Authenticated users can update gigs" on gigs for update to authenticated using (true);
create policy "Authenticated users can insert gig_singers" on gig_singers for insert to authenticated with check (true);
create policy "Authenticated users can delete gig_singers" on gig_singers for delete to authenticated using (true);
