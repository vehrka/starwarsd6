After creating an Actor you cannot open the actor. An error message appears on the console:

<error>

Uncaught (in promise) Error: The CharacterSheet Application class is not renderable because it does not implement the abstract methods _renderHTML and _replaceHTML. Consider using a mixin such as foundry.applications.api.HandlebarsApplicationMixin for this purpose.
    #render https://foundry.vehrka.net/scripts/foundry.mjs:27203
    #try https://foundry.vehrka.net/scripts/foundry.mjs:7169
    add https://foundry.vehrka.net/scripts/foundry.mjs:7142
    add https://foundry.vehrka.net/scripts/foundry.mjs:7140
    render https://foundry.vehrka.net/scripts/foundry.mjs:27190
    _onCreate https://foundry.vehrka.net/scripts/foundry.mjs:32785
    callbacks https://foundry.vehrka.net/scripts/foundry.mjs:58662
    documents https://foundry.vehrka.net/scripts/foundry.mjs:58668
    #handleCreateDocuments https://foundry.vehrka.net/scripts/foundry.mjs:58668
    _createDocuments https://foundry.vehrka.net/scripts/foundry.mjs:58581
    create https://foundry.vehrka.net/scripts/foundry.mjs:58201
    createDocuments https://foundry.vehrka.net/scripts/foundry.mjs:12504
    create https://foundry.vehrka.net/scripts/foundry.mjs:12650
    callback https://foundry.vehrka.net/scripts/foundry.mjs:33216
    _onSubmit https://foundry.vehrka.net/scripts/foundry.mjs:57256
    _onClickButton https://foundry.vehrka.net/scripts/foundry.mjs:57311
    #onClickAction https://foundry.vehrka.net/scripts/foundry.mjs:28185
    #onClick https://foundry.vehrka.net/scripts/foundry.mjs:28138
    _attachFrameListeners https://foundry.vehrka.net/scripts/foundry.mjs:28100
    _attachFrameListeners https://foundry.vehrka.net/scripts/foundry.mjs:57274
    #render https://foundry.vehrka.net/scripts/foundry.mjs:27234
    #try https://foundry.vehrka.net/scripts/foundry.mjs:7169
    add https://foundry.vehrka.net/scripts/foundry.mjs:7142
    add https://foundry.vehrka.net/scripts/foundry.mjs:7140
    render https://foundry.vehrka.net/scripts/foundry.mjs:27190
    wait https://foundry.vehrka.net/scripts/foundry.mjs:57406
    wait https://foundry.vehrka.net/scripts/foundry.mjs:57389
    prompt https://foundry.vehrka.net/scripts/foundry.mjs:57357
    createDialog https://foundry.vehrka.net/scripts/foundry.mjs:33198
    _onCreateEntry https://foundry.vehrka.net/scripts/foundry.mjs:104297
    #onCreateEntry https://foundry.vehrka.net/scripts/foundry.mjs:104278
    #onClickAction https://foundry.vehrka.net/scripts/foundry.mjs:28185
    #onClick https://foundry.vehrka.net/scripts/foundry.mjs:28138
    _attachFrameListeners https://foundry.vehrka.net/scripts/foundry.mjs:28100
foundry.mjs:27203:36

</error>
