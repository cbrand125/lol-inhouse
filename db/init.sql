DROP TABLE IF EXISTS calculations;

CREATE TABLE calculations
(
  deck_size SMALLINT,
  achieve_chance SMALLINT,
  sources SMALLINT,
  on_turn SMALLINT,
  PRIMARY KEY (deck_size, achieve_chance, sources, on_turn),
  untapped_by_tapped SMALLINT[] NOT NULL
);