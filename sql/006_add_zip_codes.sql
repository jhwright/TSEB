-- Add zip_code to institutions and singers for geographic matching
ALTER TABLE institutions ADD COLUMN zip_code text;
ALTER TABLE singers ADD COLUMN zip_code text;

-- Populate known institution zip codes (East Bay facilities)
UPDATE institutions SET zip_code = '94602' WHERE name = 'Elder Ashram';
UPDATE institutions SET zip_code = '94705' WHERE name = 'Elmwood Nursing & Rehabilitation Center';
UPDATE institutions SET zip_code = '94578' WHERE name = 'Fairmont Hospital';
UPDATE institutions SET zip_code = '94611' WHERE name = 'Kaiser NICU';
UPDATE institutions SET zip_code = '94611' WHERE name = 'Kaiser Oakland';
UPDATE institutions SET zip_code = '94611' WHERE name = 'Kaiser Oakland Palliative Care';
UPDATE institutions SET zip_code = '94611' WHERE name = 'Kaiser Oakland Site Developer';
UPDATE institutions SET zip_code = '94577' WHERE name = 'Kaiser San Leandro';
UPDATE institutions SET zip_code = '94601' WHERE name = 'Mercy Retirement and Care Center';
UPDATE institutions SET zip_code = '94611' WHERE name = 'Piedmont Gardens Skilled Nursing/Health Center';
UPDATE institutions SET zip_code = '94611' WHERE name = 'Piedmont Gardens IL (song baths)';
UPDATE institutions SET zip_code = '94612' WHERE name = 'St. Paul''s Towers';
UPDATE institutions SET zip_code = '94611' WHERE name = 'The POINT at Rockridge';
UPDATE institutions SET zip_code = '94563' WHERE name = 'Ace Home Health and Hospice';
UPDATE institutions SET zip_code = '94706' WHERE name = 'Belmont Village Senior Living';
UPDATE institutions SET zip_code = '94704' WHERE name = 'Chaparral House';
UPDATE institutions SET zip_code = '94609' WHERE name = 'Children''s Hospital Oakland';
UPDATE institutions SET zip_code = '94568' WHERE name = 'GENTIVA Healthcare Dublin (formerly Kindred Hospice)';
UPDATE institutions SET zip_code = '94612' WHERE name = 'AccentCare Hospice';
UPDATE institutions SET zip_code = '94704' WHERE name = 'Berkeley Pine Hill';
