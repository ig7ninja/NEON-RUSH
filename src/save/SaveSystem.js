const SAVE_KEY = 'neon-rush-save-v1';

const DEFAULT_SAVE = {
  unlocked: 1,
  credits: 0,
  upgrades: {},
  best: {},
  settings: null,
};

export class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        upgrades: parsed.upgrades || {},
        best: parsed.best || {},
      };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable — game still playable this session */
    }
  }

  highestUnlocked() {
    return Math.max(1, Math.min(this.data.unlocked, 99));
  }

  isUnlocked(index) {
    return index < this.data.unlocked;
  }

  unlock(index) {
    if (index + 1 > this.data.unlocked) {
      this.data.unlocked = index + 1;
      this.persist();
    }
  }

  getCredits() {
    return this.data.credits;
  }

  addCredits(n) {
    this.data.credits += n;
    this.persist();
  }

  spendCredits(n) {
    if (this.data.credits < n) return false;
    this.data.credits -= n;
    this.persist();
    return true;
  }

  getUpgradeRank(id) {
    return this.data.upgrades[id] || 0;
  }

  buyUpgrade(id, cost) {
    if (this.data.credits < cost) return false;
    this.data.credits -= cost;
    this.data.upgrades[id] = (this.data.upgrades[id] || 0) + 1;
    this.persist();
    return true;
  }

  recordBest(index, score) {
    const key = String(index);
    const prev = this.data.best[key];
    if (prev === undefined || score > prev) {
      this.data.best[key] = score;
      this.persist();
      return prev !== undefined;
    }
    return false;
  }

  getBest(index) {
    return this.data.best[String(index)];
  }

  loadSettings() {
    return this.data.settings || {};
  }

  saveSettings(settings) {
    this.data.settings = settings;
    this.persist();
  }

  resetAll() {
    this.data = { ...DEFAULT_SAVE };
    this.persist();
  }
}
