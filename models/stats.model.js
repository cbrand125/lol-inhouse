const axios = require('axios');
const db = require('../db');
const { champIDtoName } = require('../utils/riotApiUtils');
const ClientFriendlyError = require('../utils/ClientFriendlyError');
require('dotenv').config();

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
}, userid) => {
  if (!gameID || !tournamentName || !userid) {
    throw new ClientFriendlyError('Missing Required Parameters', 400);
  }

  const tournamentData = await db.query(
    `SELECT * FROM tournaments WHERE tournament_name = $1;`,
    [tournamentName]
  );

  if (tournamentData.rowCount !== 0) {
    if (tournamentData.rows[0].creator_id !== userid) {
      if (!tournamentData.rows[0].authorized_ids.includes(userid)) {
        throw new ClientFriendlyError('User not authorized to save game data for this tournament name', 403);
      }
    }
  } else {
    db.query(
      `INSERT INTO tournaments (name, creator_id) VALUES ($1, $2);`,
      [
        tournamentName,
        userid
      ]
    );
  }

  const { data } = await axios.get(
    `https://na1.api.riotgames.com/lol/match/v4/matches/${gameID}`,
    {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
    }
  );

  const savePromises = [];

  for (let i = 0; i < 10; i++) {
    if (!data.participantIdentities[i]) {
      throw new ClientFriendlyError('Participants Not Found', 404);
    }

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
  if (!tournamentName) {
    throw new ClientFriendlyError('Missing Required Parameters', 400);
  }

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
  for (const { player } of players) {
    const statCalcs = {};
    statCalcs.kda = {};
    statCalcs.kda.champs = {};
    statCalcs.kda.roles = {};
    statCalcs.win = {};
    statCalcs.win.champs = {};
    statCalcs.win.roles = {};
    for (const gameData of playerData[player]) {
      const { kills, deaths, assists, champ, position, win } = gameData;
      const kda = (kills + assists) / Math.max(1, deaths);

      (statCalcs.kda.champs[champ] = statCalcs.kda.champs[champ] || []).push(kda);
      (statCalcs.kda.roles[position] = statCalcs.kda.roles[position] || []).push(kda);
      (statCalcs.win.champs[champ] = statCalcs.win.champs[champ] || []).push(win);
      (statCalcs.win.roles[position] = statCalcs.win.roles[position] || []).push(win);
      (statCalcs.kda.overall = statCalcs.kda.overall || []).push(kda);
      (statCalcs.win.overall = statCalcs.win.overall || []).push(win);
    }

    returnData[player] = {};
    returnData[player]['Overall Games Played'] = statCalcs.win.overall.length;
    returnData[player]['Overall Winrate'] = winrate(statCalcs.win.overall);
    returnData[player]['Overall KDA'] = average(statCalcs.kda.overall);

    returnData[player]['Champions'] = {};
    for (const champ of Object.keys(statCalcs.kda.champs)) {
      returnData[player]['Champions'][champ] = {};
      returnData[player]['Champions'][champ]['Games Played'] = statCalcs.win.champs[champ].length;
      returnData[player]['Champions'][champ]['Winrate'] = winrate(statCalcs.win.champs[champ]);
      returnData[player]['Champions'][champ]['KDA'] = average(statCalcs.kda.champs[champ]);
    }

    returnData[player]['Roles'] = {};
    for (const role of Object.keys(statCalcs.kda.roles)) {
      returnData[player]['Roles'][role] = {};
      returnData[player]['Roles'][role]['Games Played'] = statCalcs.win.roles[role].length;
      returnData[player]['Roles'][role]['Winrate'] = winrate(statCalcs.win.roles[role]);
      returnData[player]['Roles'][role]['KDA'] = average(statCalcs.kda.roles[role]);
    }
  }

  return returnData;
};
