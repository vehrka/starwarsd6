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

  /**
   * Open a roll dialog and wait for the user's input.
   * @param {object} [options={}]  Options forwarded to render()
   * @returns {Promise<{ numActions: number }|null>}  null if cancelled
   */
  static async prompt(options = {}) {
    return new Promise(resolve => {
      const dialog = new RollDialog(options);
      dialog.#resolve = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.numActions = 1;
    return context;
  }

  // Called when the form is submitted (Roll button)
  static #onSubmit(event, form, formData) {
    const numActions = Math.min(4, Math.max(1, parseInt(formData.get("numActions") ?? "1")));
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolve({ numActions });
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
