-- TSEB Seed Data - Migrated from "Bedside Venues Outreach Tracking.xlsx"
-- Run AFTER 001_schema.sql

-- ============================================================
-- SINGERS (from "TSEB volunteer outreachers" sheet + active venue data)
-- ============================================================
insert into singers (id, first_name, role, availability, notes) values
  ('a0000001-0000-0000-0000-000000000001', 'Claire',     'outreacher', 'available',   'Outreach: Bristol, Providence ElderPlace'),
  ('a0000001-0000-0000-0000-000000000002', 'Daria',      'both',       'available',   'Publicity lead - Oaklandside article; sings at Lakeside'),
  ('a0000001-0000-0000-0000-000000000003', 'Grace',      'outreacher', 'available',   'Outreach: Mercy'),
  ('a0000001-0000-0000-0000-000000000004', 'Jacqueline', 'both',       'available',   'Anchor at Lakeside'),
  ('a0000001-0000-0000-0000-000000000005', 'Hadas',      'outreacher', 'available',   'Outreach: Ace Home Health, Mark Estes contacts, multiple institutions'),
  ('a0000001-0000-0000-0000-000000000006', 'Joan',       'outreacher', 'unavailable', 'Outreach: Elmwood. On hold - recovering'),
  ('a0000001-0000-0000-0000-000000000007', 'Kathleen',   'outreacher', 'available',   'Outreach: Kaiser San Leandro, Holistic Palliative Care'),
  ('a0000001-0000-0000-0000-000000000008', 'Kim',        'both',       'available',   'Sings at Piedmont Gardens; outreach St. Paul''s Towers'),
  ('a0000001-0000-0000-0000-000000000009', 'Lisa',       'singer',     'available',   'Sings at Kaiser NICU'),
  ('a0000001-0000-0000-0000-000000000010', 'Megan',      'outreacher', 'available',   NULL),
  ('a0000001-0000-0000-0000-000000000011', 'Penelope',   'both',       'available',   'Sings at Fairmont (every other week); outreach Pathways, Piedmont, The Point'),
  ('a0000001-0000-0000-0000-000000000012', 'Rachel',     'singer',     'available',   NULL),
  ('a0000001-0000-0000-0000-000000000013', 'Saskia',     'singer',     'available',   NULL),
  ('a0000001-0000-0000-0000-000000000014', 'Shelley',    'outreacher', 'unavailable', 'Outreach: Hospice East Bay. On hold - partner recovering'),
  ('a0000001-0000-0000-0000-000000000015', 'Susan H',    'outreacher', 'available',   'Outreach: end-of-life organizations, Piedmont Gardens IL'),
  ('a0000001-0000-0000-0000-000000000016', 'Monica',     'singer',     'available',   'Anchor at Fairmont; sings at Piedmont Gardens, Lakeside'),
  ('a0000001-0000-0000-0000-000000000017', 'Margo',      'singer',     'available',   'Anchor at Kaiser NICU'),
  ('a0000001-0000-0000-0000-000000000018', 'Annie',      'singer',     'available',   'Sings at Fairmont'),
  ('a0000001-0000-0000-0000-000000000019', 'Barbara',    'singer',     'available',   'Sings at Kaiser NICU'),
  ('a0000001-0000-0000-0000-000000000020', 'Max',        'both',       'available',   'Sings at Mercy Retirement'),
  ('a0000001-0000-0000-0000-000000000021', 'Nora',       'singer',     'available',   'Sings at Mercy Retirement'),
  ('a0000001-0000-0000-0000-000000000022', 'Silvia',     'singer',     'available',   'Sings at Mercy Retirement'),
  ('a0000001-0000-0000-0000-000000000023', 'Cindy',      'singer',     'available',   'Sings at Piedmont Gardens'),
  ('a0000001-0000-0000-0000-000000000024', 'Susan',      'singer',     'available',   'Sings at Piedmont Gardens (Team A)'),
  ('a0000001-0000-0000-0000-000000000025', 'Brenna',     'both',       'available',   'Sings at Piedmont Gardens (Team B); coordinates multiple institutions'),
  ('a0000001-0000-0000-0000-000000000026', 'Margit',     'singer',     'available',   'Sings at Piedmont Gardens (Team B)'),
  ('a0000001-0000-0000-0000-000000000027', 'Joanne',     'singer',     'available',   'Sings at Lakeside (alternate anchor)'),
  ('a0000001-0000-0000-0000-000000000028', 'Molly',      'outreacher', 'available',   'Outreach: Elmwood, Pathways'),
  ('a0000001-0000-0000-0000-000000000029', 'Kit',        'outreacher', 'available',   'Outreach: Elder Ashram, The Point, St. Paul''s'),
  ('a0000001-0000-0000-0000-000000000030', 'Nur',        'outreacher', 'available',   NULL);

-- ============================================================
-- INSTITUTIONS - Active Venues
-- ============================================================
insert into institutions (id, name, institution_type, address, status, pipeline_stage, outreacher_id, recurrence, notes) values
  ('b0000001-0000-0000-0000-000000000001', 'Fairmont Hospital', 'hospital', 'San Leandro', 'active', 'active',
    'a0000001-0000-0000-0000-000000000016', 'weekly', 'Weekly sing resumed 4/27/22. Monica anchor; Annie; Penelope every other week'),
  ('b0000001-0000-0000-0000-000000000002', 'Kaiser NICU', 'nicu', 'Oakland', 'active', 'active',
    'a0000001-0000-0000-0000-000000000017', 'weekly', 'Weekly anchored by Margo, Lisa, Barbara'),
  ('b0000001-0000-0000-0000-000000000003', 'Mercy Retirement and Care Center', 'retirement', 'Foothill & 35th Ave, Oakland', 'active', 'active',
    'a0000001-0000-0000-0000-000000000003', 'weekly', 'Max, Nora, Silvia as of 7/2025. Adding Memory Care starting 2025.09.04'),
  ('b0000001-0000-0000-0000-000000000004', 'Piedmont Gardens Skilled Nursing/Health Center', 'nursing_snf', NULL, 'active', 'active',
    'a0000001-0000-0000-0000-000000000025', 'monthly', '2 teams each monthly. Team A: Monica, Cindy, Susan. Team B: Brenna, Kim, Margit'),
  ('b0000001-0000-0000-0000-000000000005', 'Lakeside', 'senior_center', NULL, 'active', 'active',
    'a0000001-0000-0000-0000-000000000004', '2x_month', '2x/month. Jacquelyn anchor, Joanne alternate anchor, Monica, Daria');

-- ============================================================
-- INSTITUTIONS - Outreach / In-process
-- ============================================================
insert into institutions (id, name, institution_type, address, status, pipeline_stage, outreacher_id, next_step, next_step_due, notes) values
  ('b0000001-0000-0000-0000-000000000006', 'Ace Home Health and Hospice', 'hospice', 'Moraga Way, Orinda', 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000005', 'Call again in one week if no response', '2025-09-02',
    'Contact before pandemic was resumed 10/2024 by Shelley. Lots of phone tag. Interest from their side.'),
  ('b0000001-0000-0000-0000-000000000007', 'Belmont Village Senior Living', 'retirement', 'Albany', 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000005', 'Call again in one week if no response', '2025-09-02',
    'Shelley has friend-of-friend connection with Barbara who oversees activities.'),
  ('b0000001-0000-0000-0000-000000000008', 'Bristol Hospice', 'hospice', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000001', 'TBD', NULL,
    'Sent outreach intro to Alex (CEO), he sent to VP. Says he will send us business.'),
  ('b0000001-0000-0000-0000-000000000009', 'Bristol Hospice EB', 'hospice', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000025', 'Brenna scheduling sing for Oakland client', NULL,
    '10/16/25 Brenna returned call from Diane Slabaugh. Send biz & postcards.'),
  ('b0000001-0000-0000-0000-000000000010', 'East Bay End of Life Doula Network', 'other', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000015', 'Susan will send blurb to Nancy to send to network', NULL,
    'Nancy is happy to send info to her networks. Kit is a member and will follow up.'),
  ('b0000001-0000-0000-0000-000000000011', 'Elder Ashram', 'other', '3121 Fruitvale Ave, Oakland, CA 94602', 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000029', NULL, NULL, NULL),
  ('b0000001-0000-0000-0000-000000000012', 'Elmwood Nursing & Rehabilitation Center', 'nursing_snf', '2829 Shattuck Ave, Berkeley, CA 94705', 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000028', 'Left message & will followup, also sent letter of intro', '2025-07-22',
    'Contact acquired by Hadas through hospice volunteer (Bonnie Howe). TSEB has sung here in the past.'),
  ('b0000001-0000-0000-0000-000000000013', 'End of Life Learning Community', 'other', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000015', 'Susan will send blurb to Nancy to send to network', NULL,
    'Nancy is happy to send info to her networks.'),
  ('b0000001-0000-0000-0000-000000000014', 'HealthFlex Home Health Services', 'hospice', NULL, 'outreach', 'initial_contact',
    NULL, 'PHONE Xavier', '2025-09-02',
    'Email bounced 8/26/2025. Need to call Xavier directly.'),
  ('b0000001-0000-0000-0000-000000000015', 'Holistic Palliative Care: Hospice Care at Home', 'hospice', NULL, 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000007', NULL, NULL,
    'Left a message 9/27/24 (Shelley or Nora)'),
  ('b0000001-0000-0000-0000-000000000016', 'Hospice East Bay', 'hospice', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000005', 'Emailed Joe areas we serve and intro letter', '2025-09-16',
    'Shelley left cards with Joe, very familiar with Threshold.'),
  ('b0000001-0000-0000-0000-000000000017', 'Kaiser Oakland', 'hospital', NULL, 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000028', 'Send intro letter and then phone', NULL,
    'Potentially adult ICU or hospice. 2/6/26 Oakland Hospice referred daughter for grieving mom in Albany. Per Jacquelyn very hard to contact anyone.'),
  ('b0000001-0000-0000-0000-000000000018', 'Kaiser Oakland Palliative Care', 'hospital', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000025', 'Bret emailed re referral & turnaround info', '2025-08-18',
    'Called and emailed. He replied promptly & will make referrals as they arise.'),
  ('b0000001-0000-0000-0000-000000000019', 'Lakeside Park (outreach)', 'senior_center', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000004', 'More sings? Ask Jacquelyn if she wants to continue being point', '2026-02-06',
    'Final client died in December.'),
  ('b0000001-0000-0000-0000-000000000020', 'Multiple contacts (Mark Estes)', 'other', NULL, 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000005', 'Hadas awaiting intros to Mark''s contacts', '2025-08-08',
    'TSEB Susan Hagstrom connected us. Mark is a retired chaplain who will make e-introductions.'),
  ('b0000001-0000-0000-0000-000000000021', 'Pathways Home and Hospice', 'hospice', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000028', 'Ongoing referrals', '2025-09-12',
    'Evelyn Vallacqua knows of us and is happy to refer. Brenna has calls with Debbie re multiple clients.'),
  ('b0000001-0000-0000-0000-000000000022', 'Piedmont Gardens IL (song baths)', 'retirement', NULL, 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000015', NULL, NULL,
    'Kim''s proposal to offer soundbaths. Contacted Cindy and Kathleen about holding event. Invitation to IL residents.'),
  ('b0000001-0000-0000-0000-000000000023', 'The POINT at Rockridge', 'retirement', '4500 Gilbert Street, Oakland', 'outreach', 'in_conversation',
    'a0000001-0000-0000-0000-000000000029', NULL, NULL,
    'Spoke with Jennifer Gutierrez, activities director. Penelope met with Jennifer 9/17/25.'),
  ('b0000001-0000-0000-0000-000000000024', 'St. Paul''s Towers', 'retirement', NULL, 'pending', 'site_visit',
    'a0000001-0000-0000-0000-000000000029', 'In process', '2026-02-27',
    'Kit speaking with Aliya, activities director. Connected with Susan Melin, dir of social services. In process 2-27-26.'),
  ('b0000001-0000-0000-0000-000000000025', 'Sonata Hospice', 'hospice', NULL, 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000025', 'Returned 10/27 call on 10/28, left msg', NULL, NULL),
  ('b0000001-0000-0000-0000-000000000026', 'Kaiser San Leandro', 'hospital', NULL, 'outreach', 'initial_contact',
    'a0000001-0000-0000-0000-000000000007', 'Check once more with chaplain', '2025-09-20',
    'Kathleen knows chaplain through her church. Too much red tape but will check.');

-- ============================================================
-- INSTITUTIONS - Eliminated
-- ============================================================
insert into institutions (id, name, institution_type, status, pipeline_stage, elimination_reason, notes) values
  ('b0000001-0000-0000-0000-000000000100', 'Chaparral House', 'nursing_snf', 'eliminated', 'eliminated', 'No longer have hospice', 'Source: Nur'),
  ('b0000001-0000-0000-0000-000000000101', 'Suncrest', 'hospice', 'eliminated', 'eliminated', 'Too many barriers', 'Source: Brenna/Jacqueline'),
  ('b0000001-0000-0000-0000-000000000102', 'Vitas', 'hospice', 'eliminated', 'eliminated', 'Too many barriers', 'Source: Shelley'),
  ('b0000001-0000-0000-0000-000000000103', 'Kaiser Oakland Site Developer', 'hospital', 'eliminated', 'eliminated', 'Anita Tubit-Nend did not call back as of 10/2024', 'Source: Shelley'),
  ('b0000001-0000-0000-0000-000000000104', 'Sutter Care & Home Hospice', 'hospice', 'eliminated', 'eliminated', 'Require 6-week volunteer training to obtain referrals', 'Source: Nora and Shelley 10/2024'),
  ('b0000001-0000-0000-0000-000000000105', 'AccentCare Hospice', 'hospice', 'eliminated', 'eliminated', 'No longer in Bay Area', 'Per phone switchboard 8/26/2025'),
  ('b0000001-0000-0000-0000-000000000106', 'GENTIVA Healthcare Dublin (formerly Kindred Hospice)', 'hospice', 'eliminated', 'eliminated', 'Closing down in CA', 'Per volunteer coordinator 8/26/2025'),
  ('b0000001-0000-0000-0000-000000000107', 'Bridge', 'hospice', 'eliminated', 'eliminated', 'No longer serve East Bay', 'Per outgoing phone message');

-- ============================================================
-- INSTITUTIONS - Previous (potentially renew)
-- ============================================================
insert into institutions (id, name, status, pipeline_stage, notes) values
  ('b0000001-0000-0000-0000-000000000200', 'AgeSong', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000201', 'Bayview Rehab', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000202', 'Berkeley Pine Hill', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000203', 'Crown Bay', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000204', 'Golden Living Guest Home', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000205', 'Holy Family', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000206', 'Marymount Villa', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000207', 'Oakmont', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000208', 'Oakland Heights', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000209', 'Oakland Health', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000210', 'Pacifica Senior', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000211', 'Rounseville Nursing', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000212', 'Sunrise', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000213', 'Windsor Health', 'previous', 'on_hold', 'From Brenna - potentially renew'),
  ('b0000001-0000-0000-0000-000000000214', 'Children''s Hospital Oakland', 'previous', 'on_hold', 'Volunteer coordinator released during COVID. Need new contact. Max no longer interested in coordinating. Previous singers: Joanne, Margo, Lisa, Penelope, Jen, Kat, Mallory.'),
  ('b0000001-0000-0000-0000-000000000215', 'Silverado', 'previous', 'on_hold', 'Diana anchored weekly/2x-mo sing 2017-2018. Low priority for outreach.'),
  ('b0000001-0000-0000-0000-000000000216', 'Bay Area Healthcare Center', 'previous', 'on_hold', 'Oakland. Ongoing sing (Brenna & Rosemary) & outreach with facility admin.');

-- ============================================================
-- CONTACTS (from Ongoing Outreach + Eliminated sheets)
-- ============================================================
insert into contacts (institution_id, first_name, last_name, job_title, email, phone, is_primary) values
  -- Active venues
  ('b0000001-0000-0000-0000-000000000003', 'Josie', NULL, 'Assistant Director', NULL, '510-269-9600', true),
  ('b0000001-0000-0000-0000-000000000022', 'Jenevieve', 'Francisco', 'Head of activities for IL', 'francisco@humangood.org', '510-597-6713', true),
  ('b0000001-0000-0000-0000-000000000022', NULL, 'Webb', 'Spiritual Care Director', 'Shelly.Webb@humangood.org', NULL, false),
  -- Outreach
  ('b0000001-0000-0000-0000-000000000006', 'Ellen', 'Creighton', 'Volunteer Coordinator', NULL, '925-258-9101', true),
  ('b0000001-0000-0000-0000-000000000007', 'Barbara', 'Hulin', 'Activities Director', NULL, '510-631-0832', true),
  ('b0000001-0000-0000-0000-000000000008', 'Alex', 'Mauricio', 'CEO', NULL, NULL, true),
  ('b0000001-0000-0000-0000-000000000009', 'Allison', 'Marbella', 'Volunteer Coordinator', 'allison.marbella@bristolhospice.com', '510-693-7732', true),
  ('b0000001-0000-0000-0000-000000000010', 'Nancy', 'Finkle', NULL, NULL, '(510) 239-REST', true),
  ('b0000001-0000-0000-0000-000000000012', 'Andre', NULL, 'Activities Director', NULL, '(510) 665-2800', true),
  ('b0000001-0000-0000-0000-000000000014', 'Xavier', NULL, 'Volunteer Coordinator', 'xavier@healthflex.com (BOUNCED)', '510-533-9300', true),
  ('b0000001-0000-0000-0000-000000000015', 'Willa', 'Keizer, D Div', 'Volunteer & bereavement coordinator', 'willa@hpcbay.com', '925-306-5108', true),
  ('b0000001-0000-0000-0000-000000000015', 'Zenaida', 'Penetrante', 'Volunteer Coordinator', 'info@hpcbay.com', '510-285-7800', false),
  ('b0000001-0000-0000-0000-000000000016', 'Victoria', 'Briskin', 'Volunteer Coordinator', 'victoriab@hospiceeastbay.org', '925-887-5678', true),
  ('b0000001-0000-0000-0000-000000000016', 'Joseph', 'Lucille', 'Mgr of Grief Support & Volunteer Svcs', 'Josephl@hospiceEastBay.org', NULL, false),
  ('b0000001-0000-0000-0000-000000000017', 'Elizabeth', 'Paul', 'Social Work Director', NULL, NULL, true),
  ('b0000001-0000-0000-0000-000000000018', 'Bret', 'Gorden', 'SW', 'bret.k.gorden@kp.org', '510-254-1727', true),
  ('b0000001-0000-0000-0000-000000000019', 'Grant', 'Haywood', 'Executive Director', 'ghaywood@watermarkcommunities.com', '510-444-4684', true),
  ('b0000001-0000-0000-0000-000000000020', 'Mark', 'Estes', 'Retired chaplain', NULL, NULL, true),
  ('b0000001-0000-0000-0000-000000000021', 'Edie', 'Lumillo', NULL, NULL, '408-773-4271', true),
  ('b0000001-0000-0000-0000-000000000024', 'Susan', 'Melin', 'Director of Social Services', 'smelin@frontporch.net', '510-891-8037', true),
  ('b0000001-0000-0000-0000-000000000025', 'Maria', 'Santiago', 'Hospice Chaplain', NULL, '954-803-4735', true),
  ('b0000001-0000-0000-0000-000000000025', 'Sabrina', NULL, 'Director of Social Services', NULL, NULL, false),
  ('b0000001-0000-0000-0000-000000000026', 'Stephanie', 'Gameros', 'Chaplain', NULL, NULL, true),
  -- Eliminated
  ('b0000001-0000-0000-0000-000000000104', 'Jennifer', NULL, 'Volunteer Coordinator', NULL, '510-263-0900', true);

-- ============================================================
-- ACTIVITY LOG (key historical entries from spreadsheet notes)
-- ============================================================
insert into activities (institution_id, singer_id, activity_type, activity_date, description) values
  -- Ace Home Health
  ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005', 'voicemail', '2025-08-26', 'Hadas left message for Ellen'),
  ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000014', 'note', '2024-10-01', 'Contact before pandemic resumed by Shelley. Lots of phone tag. Interest from their side.'),
  -- Belmont Village
  ('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'phone_call', '2025-08-26', 'Hadas called in lieu of Shelley, left message with switchboard'),
  -- Bristol Hospice
  ('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000001', 'email_sent', '2025-08-01', 'Sent outreach intro to Alex (CEO). He sent it to the VP. Says he will for sure send us business.'),
  -- Bristol Hospice EB
  ('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000025', 'phone_call', '2025-10-16', 'Brenna returned call from Diane Slabaugh whose manager asked her to contact us. Send biz & postcards.'),
  -- Elmwood
  ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000028', 'voicemail', '2025-07-22', 'Left message & will followup. Also sent letter of intro.'),
  -- HealthFlex
  ('b0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000005', 'email_sent', '2025-08-26', 'EMAIL BOUNCED. Hadas emailed intro letter with cover note introducing TSEB and offering to sing at staff meeting.'),
  -- Hospice East Bay
  ('b0000001-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000005', 'email_sent', '2025-08-26', 'Hadas emailed intro letter to 3 contacts, providing Joe a list of cities we serve.'),
  -- Kaiser Oakland Palliative
  ('b0000001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000025', 'phone_call', '2025-08-18', 'Called (no answer/no vm) & emailed info. He emailed back promptly & will make referrals as they arise.'),
  -- Mark Estes
  ('b0000001-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000005', 'phone_call', '2025-07-30', 'Mark and I spoke. He will now send e-introductions between me and his contacts. Standing by for cc on those messages.'),
  -- Pathways
  ('b0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000028', 'voicemail', '2025-09-02', 'Left msg for Evelyn Vallacqua, vol service coordinator'),
  ('b0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000025', 'phone_call', '2026-02-06', 'Brenna: call with Debbie re 1 client in Alameda'),
  -- The POINT
  ('b0000001-0000-0000-0000-000000000023', 'a0000001-0000-0000-0000-000000000029', 'phone_call', '2025-09-15', 'Spoke with Jennifer Gutierrez, activities director.'),
  ('b0000001-0000-0000-0000-000000000023', 'a0000001-0000-0000-0000-000000000011', 'in_person', '2025-09-17', 'Penelope met with Jennifer'),
  -- St. Paul''s
  ('b0000001-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000029', 'note', '2026-02-06', 'Kit speaking with Aliya, activities director. She will connect with Susan Melin. Kit sent intro letter. Aliya reached out to Brenna. In process 2-27-26.'),
  -- Sonata
  ('b0000001-0000-0000-0000-000000000025', 'a0000001-0000-0000-0000-000000000025', 'voicemail', '2025-10-28', 'Returned 10/27 call on 10/28, left msg'),
  -- Kaiser San Leandro
  ('b0000001-0000-0000-0000-000000000026', 'a0000001-0000-0000-0000-000000000007', 'note', '2025-08-20', 'Kathleen knows Kaiser San Leandro chaplain through her church. Chaplain says too much red tape, but will check.'),
  -- Mercy (outreach history)
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'site_visit', '2025-08-29', 'Grace visited. Left papers and cards.'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000025', 'phone_call', '2025-08-31', 'Brenna call with Josie Davis, arranging ongoing weekly memory care sing. Emailed TSEB for 3rd singer to join Max & Sylvia.');

-- ============================================================
-- GIGS (recurring singing sessions at active venues)
-- ============================================================
insert into gigs (id, institution_id, gig_date, gig_time, recurrence, notes) values
  -- Fairmont Hospital - weekly, resumed 4/27/22
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '2026-03-06', null, 'weekly',
    'Weekly sing. Penelope every other week.'),
  -- Kaiser NICU - weekly
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', '2026-03-05', null, 'weekly',
    'Weekly NICU sing'),
  -- Mercy Retirement - weekly
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', '2026-03-04', null, 'weekly',
    'Weekly sing. Adding Memory Care starting 2025.09.04.'),
  -- Piedmont Gardens SNF - Team A monthly
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', '2026-03-01', null, 'monthly',
    'Team A - monthly'),
  -- Piedmont Gardens SNF - Team B monthly
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000004', '2026-03-15', null, 'monthly',
    'Team B - monthly'),
  -- Lakeside - 2x/month
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000005', '2026-03-03', null, '2x_month',
    '2x/month sing');

-- ============================================================
-- GIG_SINGERS (singer assignments + anchors)
-- ============================================================
insert into gig_singers (gig_id, singer_id, is_anchor) values
  -- Fairmont: Monica (anchor), Annie, Penelope
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000016', true),
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000018', false),
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000011', false),
  -- Kaiser NICU: Margo (anchor), Lisa, Barbara
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000017', true),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000009', false),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000019', false),
  -- Mercy: Max, Nora, Silvia (no designated anchor in notes)
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000020', false),
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000021', false),
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000022', false),
  -- Piedmont Gardens Team A: Monica, Cindy, Susan
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000016', false),
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000023', false),
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000024', false),
  -- Piedmont Gardens Team B: Brenna, Kim, Margit
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000025', false),
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000008', false),
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000026', false),
  -- Lakeside: Jacqueline (anchor), Joanne (alternate anchor), Monica, Daria
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000004', true),
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000027', false),
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000016', false),
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', false);
