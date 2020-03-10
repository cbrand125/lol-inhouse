const axios = require('axios');
const db = require('../db');
const { champIDtoName } = require('../utils/riotApiUtils');
require('dotenv').config();

class PlayerAggregatedData {
  constructor() {
    this.kda = {};
    this.kda.overall = [];
    this.kda.champs = {};
    this.kda.roles = {};
    this.win = {};
    this.win.overall = [];
    this.win.champs = {};
    this.win.roles = {};
  }
}

const average = (values) => {
  values.reduce(
    (total, current) => total + current,
    0
  ) / values.length;
};

const winrate = (bools) => {
  bools.reduce(
    (winCount, current) => (current ? winCount + 1 : winCount),
    0
  ) / bools.length;
};

exports.saveGameData = async ({
  game_id: gameID,
  tournament_name: tournamentName
}) => {
  const { data } = await axios.get(
    `https://na1.api.riotgames.com/lol/match/v4/matches/${gameID}`,
    {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
    }
  );

  const savePromises = [];

  for (let i = 0; i < 10; i++) {
    const player = data.participantIdentities[i].player.summonerName;
    const { kills, deaths, assists, win } = data.participants[i].stats;
    const champ = champIDtoName(data.participants[i].championId);
    let position = data.participants[i].timeline.lane;
    if (data.participants[i].timeline.role === 'DUO_SUPPORT') {
      position = 'SUPPORT';
    }

    savePromises.push(
      db.query(
        `INSERT INTO game_data (player, game_id, tournament_name, kills, deaths, assists, champ, position, win) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [
          player,
          gameID,
          tournamentName,
          kills,
          deaths,
          assists,
          champ,
          position,
          win
        ]
      )
    );
  }

  return Promise.all(savePromises);
};

exports.retrieveTournament = async ({ tournament_name: tournamentName }) => {
  console.log('made it 0');
  let players = await db.query(
    `SELECT player FROM game_data WHERE tournament_name = $1;`,
    [tournamentName]
  );
  players = players.rows;

  const retrievePromises = [];
  const playerData = {};

  for (const { player } of players) {
    retrievePromises.push(
      db
        .query(
          `SELECT * FROM game_data WHERE player = $1 AND tournament_name = $2;`,
          [player, tournamentName]
        )
        .then(result => {
          playerData[player] = result.rows;
        })
    );
  }

  await Promise.all(retrievePromises);

  const returnData = {};
  console.log('made it 1');
  for (const { player } of players) {
    const statAggregate = new PlayerAggregatedData();
    const kdas = statAggregate.kda.overall;
    const champKdas = statAggregate.kda.champs;
    const roleKdas = statAggregate.kda.roles;
    const wins = statAggregate.win.overall;
    const champWins = statAggregate.win.champs;
    const roleWins = statAggregate.win.roles;
    console.log('made it 2');

    for (const gameData of playerData[player]) {
      const { kills, deaths, assists, champ, position, win } = gameData;
      const kda = (kills + assists) / Math.max(1, deaths);

      (champKdas[champ] = champKdas[champ] || []).push(kda);
      (roleKdas[position] = roleKdas[position] || []).push(kda);
      (champWins[champ] = champWins[champ] || []).push(win);
      (roleWins[position] = roleWins[position] || []).push(win);
      (kdas = kdas || []).push(kda);
      (wins = wins || []).push(win);
    }
    console.log('made it 3');

    returnData[player] = {};
    const returnPlayer = returnData[player];

    returnPlayer['Overall Games Played'] = wins.length;
    returnPlayer['Overall Winrate'] = winrate(wins);
    returnPlayer['Overall KDA'] = average(kdas);

    console.log('made it 4');

    returnPlayer['Champions'] = {};
    for (const champ of Object.keys(statCalcs.kda.champs)) {
      returnPlayer['Champions'][champ] = {};
      const currentPlayerChamp = returnPlayer['Champions'][champ];

      currentPlayerChamp['Games Played'] = champWins[champ].length;
      currentPlayerChamp['Winrate'] = winrate(champWins[champ]);
      currentPlayerChamp['KDA'] = average(champKdas[champ]);
    }

    console.log('made it 5');
    returnPlayer['Roles'] = {};
    for (const role of Object.keys(statCalcs.kda.roles)) {
      returnPlayer['Roles'][role] = {};
      const currentPlayerRole = returnPlayer['Roles'][role];

      currentPlayerRole['Games Played'] = roleWins[role].length;
      currentPlayerRole['Winrate'] = winrate(roleWins[role]);
      currentPlayerRole['KDA'] = average(roleKdas[role]);
    }
  }

  console.log(returnData);
  return returnData;
};
