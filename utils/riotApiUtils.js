const champions = require('../data/champions.json');

exports.champIDtoName = (id) => {
    const champEntries = Object.entries(champions.data);

    for(const [name, data] of champEntries) {
        if (data.key === id) return name;
    }
};