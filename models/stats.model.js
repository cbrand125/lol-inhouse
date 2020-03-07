const axios = require('axios');
const db = require('../db');
const { champIDtoName } = require('../utils/riotApiUtils');
require('dotenv').config();

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

      (statCalcs.kda.champs[champ] = statCalcs.kda.champs[champ] || []).push(
        kda
      );
      (statCalcs.kda.roles[position] =
        statCalcs.kda.roles[position] || []).push(kda);
      (statCalcs.win.champs[champ] = statCalcs.win.champs[champ] || []).push(
        win
      );
      (statCalcs.win.roles[position] =
        statCalcs.win.roles[position] || []).push(win);
      (statCalcs.kda.overall = statCalcs.kda.overall || []).push(kda);
      (statCalcs.win.overall = statCalcs.win.overall || []).push(win);
    }

    returnData[player] = {};
    returnData[player]['Overall Games Played'] = statCalcs.win.overall.length;
    returnData[player]['Overall Winrate'] =
      statCalcs.win.overall.reduce(
        (winCount, current) => (current ? winCount + 1 : winCount),
        0
      ) / statCalcs.win.overall.length;
    returnData[player]['Overall KDA'] =
      statCalcs.kda.overall.reduce(
        (totalKDA, current) => totalKDA + current,
        0
      ) / statCalcs.kda.overall.length;

    returnData[player]['Champions'] = {};
    for (const champ of Object.keys(statCalcs.kda.champs)) {
      returnData[player]['Champions'][champ] = {};
      returnData[player]['Champions'][champ]['Games Played'] =
        statCalcs.win.champs[champ].length;
      returnData[player]['Champions'][champ]['Winrate'] =
        statCalcs.win.champs[champ].reduce(
          (winCount, current) => (current ? winCount + 1 : winCount),
          0
        ) / statCalcs.win.champs[champ].length;
      returnData[player]['Champions'][champ]['KDA'] =
        statCalcs.kda.champs[champ].reduce(
          (totalKDA, current) => totalKDA + current,
          0
        ) / statCalcs.kda.champs[champ].length;
    }

    returnData[player]['Roles'] = {};
    for (const role of Object.keys(statCalcs.kda.roles)) {
      returnData[player]['Roles'][role] = {};
      returnData[player]['Roles'][role]['Games Played'] =
        statCalcs.win.roles[role].length;
      returnData[player]['Roles'][role]['Winrate'] =
        statCalcs.win.roles[role].reduce(
          (winCount, current) => (current ? winCount + 1 : winCount),
          0
        ) / statCalcs.win.roles[role].length;
      returnData[player]['Roles'][role]['KDA'] =
        statCalcs.kda.roles[role].reduce(
          (totalKDA, current) => totalKDA + current,
          0
        ) / statCalcs.kda.roles[role].length;
    }
  }

  return returnData;
};
