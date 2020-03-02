const { jStat } = require('jstat');
const { bigCombination } = require('js-combinatorics');

/**
 * @param  {number} deckSize number of cards in the deck
 * @param  {number} achieveChance percent chance of success
 * @param  {number} sources usable mana sources
 * @param  {number} onTurn earliest turn that the sources should be available
 * @return {number[]} number of lands that come out untapped indexed by lands
 *                    that come out tapped. each element provides a combination
 *                    that satisfies the parameters.
 */
exports.calculateLandCombinations = (
  deckSize,
  achieveChance,
  sources,
  onTurn
) => {
  const untappedByTapped = [];
  let tapped = 0;
  let untapped = 1;
  let currentChance = 0;
  let lastUntapped = Infinity;
  const achieveChanceDecimal = achieveChance / 100;

  // loop through every number of lands that come out tapped
  while (tapped <= deckSize / 2 && untapped > 0) {
    untapped = 0;
    currentChance = calculateChance(
      deckSize,
      sources,
      onTurn,
      tapped,
      untapped
    );

    // find the lowest number of lands that come out untapped for achieve chance
    while (currentChance < achieveChanceDecimal) {
      untapped++;
      currentChance = calculateChance(
        deckSize,
        sources,
        onTurn,
        tapped,
        untapped
      );
    }

    if (tapped + untapped <= deckSize / 2 && untapped < lastUntapped) {
      untappedByTapped[tapped] = untapped;
    }

    tapped++;
    lastUntapped = untapped;
  }

  return untappedByTapped;
};

/**
 * @param  {number} deckSize number of cards in the deck
 * @param  {number} source usable mana sources
 * @param  {number} onTurn earliest turn that the sources should be available
 * @param  {number} tapped number of land that comes out tapped in the deck
 * @param  {number} untapped number of land that comes out untapped in the deck
 * @return {number} chance that this combination will get sources onTurn
 */
function calculateChance(deckSize, sources, onTurn, tapped, untapped) {
  const events = [];
  let chanceFromUntapped = 0;
  let chanceFromTapped = 0;

  /**
   * go through every combination of drawn tapped/untapped land that gets
   * available sources for the turn in question
   */
  for (let i = 0; i <= sources; i++) {
    chanceFromUntapped = hypgeomUpperCumulativeProbability(
      deckSize,
      untapped,
      7 + parseInt(onTurn) - 1,
      sources - i
    );

    chanceFromTapped = hypgeomUpperCumulativeProbability(
      deckSize,
      tapped,
      7 + parseInt(onTurn) - 2,
      i
    );

    // save the chance of this combination occuring
    events[i] = chanceFromTapped * chanceFromUntapped;
  }

  // handle edge case where only all untapped lands can satisfy this requirement
  if (sources === onTurn) {
    events[sources] = 0;
  }

  return unionIndependent(events);
}

/**
 * @param  {number} deckSize number of cards in the deck
 * @param  {number} deckSuccesses number of successes in the deck
 * @param  {number} sampleSize number of cards drawn from the deck
 * @param  {number} sampleSuccesses number of successes in the sampleSize
 * @return {number} chance of getting at least sampleSuccesses
 */
function hypgeomUpperCumulativeProbability(
  deckSize,
  deckSuccesses,
  sampleSize,
  sampleSuccesses
) {
  return (
    1 -
    (jStat.hypgeom.cdf(sampleSuccesses, deckSize, deckSuccesses, sampleSize) -
      jStat.hypgeom.pdf(sampleSuccesses, deckSize, deckSuccesses, sampleSize))
  );
}

/**
 * @param  {number[]} events probabilities of different independent events
 * @return {number} chance of at least one event occuring in the given array
 */
function unionIndependent(events) {
  let sum = 0;
  let product = 1;
  let sign = 1;

  // loop through all combinations of i different events
  for (let i = 1; i <= events.length; i++) {
    const eventCombos = bigCombination(events, i).toArray();

    // loops through each combination of i-length
    for (let j = 0; j < eventCombos.length; j++) {
      const term = eventCombos[j];

      // loop through each event in the combination
      for (let k = 0; k < term.length; k++) {
        // multiply the events together to get the chance of all happening
        // (intersection)
        product *= term[k];
      }

      // add or subtract the final product from the total sum
      sum += product * sign;
      product = 1;
    }

    // reverse adding/subtracting every i-combination
    sign *= -1;
  }

  return sum;
}
