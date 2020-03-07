const db = require('../db');
const { champIDToName } = require('../utils/riotApiUtils');
const ClientFriendlyError = require('../utils/ClientFriendlyError');

exports.calculate = async ({
  deck_size: deckSize,
  achieve_chance: achieveChance,
  sources,
  on_turn: onTurn
}) => {
  if (!deckSize || !achieveChance || !sources || !onTurn) {
    throw new ClientFriendlyError('Missing Parameters', 400);
  }

  if (
    deckSize > 100 ||
    deckSize < 40 ||
    achieveChance > 85 ||
    achieveChance < 0 ||
    sources > onTurn ||
    sources < 0 ||
    onTurn > 10 ||
    onTurn < 1
  ) {
    throw new ClientFriendlyError(
      'Improper Parameters:\ndeck_size must be exactly or between 40 and 100\nachieve_chance must be exactly or between 0 and 85\nsources must be less than or equal to on_turn and greater than 0\non_turn must be exactly or between 1 and 10',
      400
    );
  }

  const deckSizeFloor = Math.floor(deckSize);
  const achieveChanceFloor = Math.floor(achieveChance);
  const sourcesFloor = Math.floor(sources);
  const onTurnFloor = Math.floor(onTurn);

  try {
    let combinations = await db.query(
      `SELECT * FROM calculations WHERE deck_size = $1 AND achieve_chance = $2 AND sources = $3 AND on_turn = $4`,
      [deckSizeFloor, achieveChanceFloor, sourcesFloor, onTurnFloor]
    );

    if (combinations.rowCount === 0) {
      combinations = calculateLandCombinations(
        deckSizeFloor,
        achieveChanceFloor,
        sourcesFloor,
        onTurnFloor
      );

      db.query(
        `INSERT INTO calculations (deck_size, achieve_chance, sources, on_turn, untapped_by_tapped) VALUES ($1, $2, $3, $4, $5);`,
        [
          deckSizeFloor,
          achieveChanceFloor,
          sourcesFloor,
          onTurnFloor,
          combinations
        ]
      );

      return combinations;
    }

    return combinations.rows[0].untapped_by_tapped;
  } catch (err) {
    console.log(err);
    throw new ClientFriendlyError('Database Error', 500);
  }
};

exports.calculateMultipleColors = async ({
  blue,
  black,
  green,
  white,
  red,
  colorless
}) => {
  const result = {};

  if (blue) {
    result.blue = await exports.calculate(blue);
  }
  if (black) {
    result.black = await exports.calculate(black);
  }
  if (green) {
    result.green = await exports.calculate(green);
  }
  if (white) {
    result.white = await exports.calculate(white);
  }
  if (red) {
    result.red = await exports.calculate(red);
  }
  if (colorless) {
    result.colorless = await exports.calculate(colorless);
  }

  return result;
};

exports.saveGameData = async ({ game_id, tournament_name }) => {
  const { data } = await axios.get(
    'https://na1.api.riotgames.com/lol/match/v4/matches/3314461276',
    {
      headers: { 'X-Riot-Token': 'RGAPI-a29ad2a1-5609-4eed-8da2-eb782083f40f' }
    }
  );

  const savePromises = [];
  
  for (let i = 0; i < 10; i++) {
    let player = data.participantIdentities[i].player.summonerName;
    let kills = data.participants[i].stats.kills;
    let deaths = data.participants[i].stats.deaths;
    let assists = data.participants[i].stats.assists;
    let champ = champIDToName(data.participants[i].championId);
    let position = data.participants[i].timeline.lane;
    if ('DUO_SUPPORT' === data.participants[i].timeline.role) {
      position = 'SUPPORT';
    }
    let win = data.participants[i].stats.win;

    savePromises.push(new Promise(() => {
      db.query(
        `INSERT INTO game_data (player, game_id, tournament_name, kills, deaths, assists, champ, position, win) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [player, game_id, tournament_name, kills, deaths, assists, champ, position, win]
      );
    }));
  }

  return await Promise.all(savePromises);
};

exports.retrievePlayerStats = async ({ player_name }) => {
  return true;
};

exports.retrieveTournamentStats = async ({ tournament_name }) => {
  return true;
};