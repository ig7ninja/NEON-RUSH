import { LEVELS } from '../data/levels.js';

export class Progression {
  constructor(save) {
    this.save = save;
  }

  creditsFor(results) {
    return Math.max(10, Math.round(results.total / 40));
  }

  completeLevel(index, results) {
    const credits = this.creditsFor(results);
    this.save.addCredits(credits);
    const newBest = this.save.recordBest(index, results.total);
    results.newBest = newBest;
    results.credits = credits;
    if (index + 1 < LEVELS.length) {
      this.save.unlock(index + 1);
    }
  }
}
