const DEFAULT_SETTINGS = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  screenShake: true,
  reducedEffects: false,
};

export const UPGRADES = [
  {
    id: 'dashCooldown',
    name: 'FLUX COIL',
    desc: 'Dash cooldown reduced by 12% per rank.',
    cost: [120, 200, 320],
    max: 3,
  },
  {
    id: 'comboWindow',
    name: 'SYNC CHIP',
    desc: 'Combo window extended by 0.4s per rank.',
    cost: [100, 180, 280],
    max: 3,
  },
  {
    id: 'shieldCharge',
    name: 'AEGIS CELL',
    desc: 'Start each level with one shield charge.',
    cost: [240],
    max: 1,
  },
  {
    id: 'droneTint',
    name: 'CHROMA SKIN',
    desc: 'Cosmetic drone color variants.',
    cost: [60, 60, 60],
    max: 3,
  },
];

export const DRONE_TINTS = ['#4ef2ff', '#ff4fd8', '#ffd54a', '#7dff8a'];

export class GameState {
  constructor(saveSystem) {
    this.save = saveSystem;
    this.settings = { ...DEFAULT_SETTINGS, ...saveSystem.loadSettings() };
    this.rng = Math.random;
  }

  getDashCooldownRank() { return this.save.getUpgradeRank('dashCooldown'); }
  getComboWindowRank() { return this.save.getUpgradeRank('comboWindow'); }
  getShieldRank() { return this.save.getUpgradeRank('shieldCharge'); }
  getTintRank() { return this.save.getUpgradeRank('droneTint'); }

  getDroneColor() { return DRONE_TINTS[this.getTintRank() % DRONE_TINTS.length]; }

  getDashCooldown(base) {
    return base * (1 - 0.12 * this.getDashCooldownRank());
  }

  getComboWindow(base) {
    return base + 0.4 * this.getComboWindowRank();
  }

  applySettingChange(key, value) {
    this.settings[key] = value;
    this.save.saveSettings(this.settings);
  }
}
