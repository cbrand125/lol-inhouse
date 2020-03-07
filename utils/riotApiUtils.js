const champions = require('../data/champion.json');

exports.champIDtoName = id => {
  const champEntries = Object.entries(champions.data);

  for (const [name, data] of champEntries) {
    if (data.key === String(id)) {
      return name;
    }
  }

  return null;
};
