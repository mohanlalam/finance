/*
  Locally recreated migration.
*/

CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  sno integer DEFAULT 0,
  stock_name text NOT NULL,
  ticker text NOT NULL,
  yahoo_symbol text NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  amount_invested numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT holdings_portfolio_ticker_unique UNIQUE (portfolio_id, ticker)
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Seed portfolios and holdings
DO $$
DECLARE
  personal_id uuid;
  mother_id uuid;
  wife_id uuid;
BEGIN
  INSERT INTO portfolios (name, label) VALUES
    ('personal', 'My Portfolio'),
    ('mother', 'Mother''s Portfolio'),
    ('wife', 'Wife''s Portfolio')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO personal_id FROM portfolios WHERE name = 'personal';
  SELECT id INTO mother_id FROM portfolios WHERE name = 'mother';
  SELECT id INTO wife_id FROM portfolios WHERE name = 'wife';

  -- My Portfolio holdings
  INSERT INTO holdings (portfolio_id, sno, stock_name, ticker, yahoo_symbol, qty, avg_price, amount_invested) VALUES
    (personal_id, 1,  'Kotak Nifty Alpha 50 ETF',          'ALPHA',      'ALPHA.NS',       15266,   47.83,    730172.78),
    (personal_id, 2,  'Nippon IN ETF Nifty Bank BeES',      'BANKBEES',   'BANKBEES.NS',    1932,    517.5295, 999866.994),
    (personal_id, 3,  'Greaves Cotton Limited',             'GREAVESCOT', 'GREAVESCOT.NS',  1,       282,      282),
    (personal_id, 4,  'ICICI Pru Nifty Healthcare ETF',     'HEALTHIETF', 'HEALTHIETF.NS',  135,     146.9111, 19832.9985),
    (personal_id, 5,  'Hero Motocorp Limited',              'HEROMOTOCO', 'HEROMOTOCO.NS',  1,       4940,     4940),
    (personal_id, 6,  'ICICI Prudential Nifty 50 ETF',      'NIFTYIETF',  'NIFTYIETF.NS',   1045,    287,      299915),
    (personal_id, 9,  'Kaynes Technology India Limited',    'KAYNES',     'KAYNES.NS',      12,      4454,     53448),
    (personal_id, 10, 'Zerodha Nifty 1D Rate Liq ETF',      'LIQUIDCASE', 'LIQUIDCASE.NS',  1337,    110.42,   147631.54),
    (personal_id, 11, 'ICICI Nifty200 Momentum 30 ETF',     'MOM30IETF',  'MOM30IETF.NS',   4937,    32.3731,  159825.9947),
    (personal_id, 12, 'ICICI Pru Nifty Next 50 ETF',        'NEXT50IETF', 'NEXT50IETF.NS',  8423,    70.18,    591126.14),
    (personal_id, 13, 'NTPC Limited',                       'NTPC',       'NTPC.NS',        1,       411.55,   411.55),
    (personal_id, 14, 'Reliance Industries Limited',        'RELIANCE',   'RELIANCE.NS',    2,       1600,     3200),
    (personal_id, 15, 'MiraeAs NftSmC250 Mt Ql100 ETF',     'SMALLCAP',   'SMALLCAP.NS',    5084,    46.26,    235185.84),
    (personal_id, 16, 'Tata Motors Limited',                'TMCV',       'TMCV.NS',        1,       290.4582, 290.4582),
    (personal_id, 17, 'Tata Motors Passenger Vehicles',     'TMPV',       'TMPV.NS',        1,       641.9918, 641.9918),
    (personal_id, 18, 'Waaree Energies Limited',            'WAAREEENER', 'WAAREEENER.NS',  9,       1503,     13527)
  ON CONFLICT (portfolio_id, ticker) DO NOTHING;

  -- Mother's Portfolio holdings
  INSERT INTO holdings (portfolio_id, sno, stock_name, ticker, yahoo_symbol, qty, avg_price, amount_invested) VALUES
    (mother_id, 1,  'Motilal Osw Nifty500 Mmt50 ETF',      'MOMENTUM50', 'MOMENTUM50.NS',  6201,    54.92,    340558.92),
    (mother_id, 2,  'Kotak Nifty Alpha 50 ETF',            'ALPHA',      'ALPHA.NS',       4467,    49.12,    219419.04),
    (mother_id, 3,  'MiraeAs NftSmC250 Mt Ql100 ETF',      'SMALLCAP',   'SMALLCAP.NS',    2700,    47.09,    127143),
    (mother_id, 4,  'Nippon India Nifty Pharma ETF',        'PHARMABEES', 'PHARMABEES.NS',  2000,    21.3,     42600),
    (mother_id, 5,  'ICICI Nifty200 Momentum 30 ETF',       'MOM30IETF',  'MOM30IETF.NS',   900,     33.58,    30222),
    (mother_id, 6,  'Nippon India ETF Nifty 50 BeES',       'NIFTYBEES',  'NIFTYBEES.NS',   133,     261.4,    34766.2),
    (mother_id, 8,  'Nippon ETF Nifty Next 50 Jr BeES',     'JUNIORBEES', 'JUNIORBEES.NS',  10,      617,      6170),
    (mother_id, 10, 'NTPC Limited',                         'NTPC',       'NTPC.NS',        1,       424,      424)
  ON CONFLICT (portfolio_id, ticker) DO NOTHING;

  -- Wife's Portfolio holdings
  INSERT INTO holdings (portfolio_id, sno, stock_name, ticker, yahoo_symbol, qty, avg_price, amount_invested) VALUES
    (wife_id, 1,  'Power Grid Corporation of India',       'POWERGRID',  'POWERGRID.NS',   5,       267.6,    1338),
    (wife_id, 2,  'Zerodha Nifty Midcap 150 ETF',          'MID150CASE', 'MID150CASE.NS',  11080,   11.05,    122434),
    (wife_id, 3,  'Anant Raj Limited',                     'ANANTRAJ',   'ANANTRAJ.NS',    100,     500,      50000),
    (wife_id, 4,  'Tata Gold ETF',                         'TATAGOLD',   'TATAGOLD.NS',    11945,   16.99,    202945.55)
  ON CONFLICT (portfolio_id, ticker) DO NOTHING;
END $$;
