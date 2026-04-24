const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class RollDialog extends HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "roll-dialog"],
    tag: "dialog",
    window: {
      title: "STARWARSD6.RollDialog.Title",
      contentTag: "form",
      minimizable: false
    },
    position: { width: 320, height: "auto" },
    form: { handler: RollDialog.#onSubmit, closeOnSubmit: true }
  };

  static PARTS = {
    form: { template: "systems/starwarsd6/templates/dice/roll-dialog.hbs" }
  };

  static #DIFFICULTY_TIERS = [
    { labelKey: "STARWARSD6.Difficulty.VeryEasy",      mod: -10 },
    { labelKey: "STARWARSD6.Difficulty.Easy",          mod: -5  },
    { labelKey: "STARWARSD6.Difficulty.Normal",        mod: 0   },
    { labelKey: "STARWARSD6.Difficulty.Moderate",      mod: 5   },
    { labelKey: "STARWARSD6.Difficulty.Difficult",     mod: 10  },
    { labelKey: "STARWARSD6.Difficulty.VeryDifficult", mod: 15  },
    { labelKey: "STARWARSD6.Difficulty.Impossible",    mod: 20  },
  ];

  // Promise resolver — set by prompt(), called by submit/close handlers
  #resolve = null;
  #resolved = false;
  #canSpendFP = false;
  #hasFP = false;
  #isForceRoll = false;
  #showDifficulty = false;
  #defaultDifficulty = 0;

  /**
   * Open a roll dialog and wait for the user's input.
   * @param {object} [options={}]         Options
   * @param {boolean} [options.canSpendFP=false]       Whether the FP checkbox should appear
   * @param {boolean} [options.hasFP=false]            Whether the actor has FP remaining
   * @param {boolean} [options.isForceRoll=false]      Whether to show Force difficulty modifier
   * @param {boolean} [options.showDifficulty=false]   Whether to show the Difficulty number input
   * @param {number}  [options.defaultDifficulty=0]    Pre-filled value for the Difficulty input
   * @returns {Promise<{ numActions: number, useForcePoint: boolean, forceDifficultyModifier: number, difficulty: number|null }|null>}
   */
  static async prompt({ canSpendFP = false, hasFP = false, isForceRoll = false, showDifficulty = false, defaultDifficulty = 0, ...options } = {}) {
    return new Promise(resolve => {
      const dialog = new RollDialog(options);
      dialog.#resolve = resolve;
      dialog.#canSpendFP = canSpendFP;
      dialog.#hasFP = hasFP;
      dialog.#isForceRoll = isForceRoll;
      dialog.#showDifficulty = showDifficulty;
      dialog.#defaultDifficulty = defaultDifficulty;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.numActions = 1;
    context.canSpendFP = this.#canSpendFP;
    context.hasFP = this.#hasFP;
    context.isForceRoll = this.#isForceRoll;
    context.showDifficulty = this.#showDifficulty;
    context.defaultDifficulty = this.#defaultDifficulty;
    context.difficultyTiers = RollDialog.#DIFFICULTY_TIERS.map(t => ({ ...t, isDefault: t.mod === 0 }));
    return context;
  }

  // Called when the form is submitted (Roll button)
  // formData is FormDataExtended — checkboxes are coerced to booleans in formData.object
  static #onSubmit(event, form, formData) {
    const numActions = Math.min(4, Math.max(1, parseInt(formData.object.numActions ?? "1")));
    const useForcePoint = !!formData.object.useForcePoint;
    const forceDifficultyModifier = this.#isForceRoll
      ? Math.min(30, Math.max(0, parseInt(formData.object.forceDifficultyModifier ?? "0")))
      : 0;
    const tierMod = this.#showDifficulty
      ? parseInt(formData.object.difficultyTier ?? "0")
      : 0;
    const difficulty = this.#showDifficulty
      ? Math.max(0, parseInt(formData.object.difficulty ?? "0") + tierMod)
      : null;
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolve({ numActions, useForcePoint, forceDifficultyModifier, difficulty });
    }
  }

  // Called when the window is closed (X button or ESC) without submitting
  async _onClose(options) {
    await super._onClose(options);
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolve(null);
    }
  }
}
