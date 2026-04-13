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

  // Promise resolver — set by prompt(), called by submit/close handlers
  #resolve = null;
  #resolved = false;
  #canSpendFP = false;
  #hasFP = false;

  /**
   * Open a roll dialog and wait for the user's input.
   * @param {object} [options={}]         Options
   * @param {boolean} [options.canSpendFP=false]  Whether the FP checkbox should appear
   * @param {boolean} [options.hasFP=false]       Whether the actor has FP remaining
   * @returns {Promise<{ numActions: number, useForcePoint: boolean }|null>}  null if cancelled
   */
  static async prompt({ canSpendFP = false, hasFP = false, ...options } = {}) {
    return new Promise(resolve => {
      const dialog = new RollDialog(options);
      dialog.#resolve = resolve;
      dialog.#canSpendFP = canSpendFP;
      dialog.#hasFP = hasFP;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.numActions = 1;
    context.canSpendFP = this.#canSpendFP;
    context.hasFP = this.#hasFP;
    return context;
  }

  // Called when the form is submitted (Roll button)
  // formData is FormDataExtended — checkboxes are coerced to booleans in formData.object
  static #onSubmit(event, form, formData) {
    const numActions = Math.min(4, Math.max(1, parseInt(formData.object.numActions ?? "1")));
    const useForcePoint = !!formData.object.useForcePoint;
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolve({ numActions, useForcePoint });
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
