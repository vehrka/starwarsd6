const DEFAULT_SKILLS = [
  { name: "Blaster",                       attribute: "DEX" },
  { name: "Brawling Parry",                attribute: "DEX" },
  { name: "Dodge",                         attribute: "DEX" },
  { name: "Melee Combat",                  attribute: "DEX" },
  { name: "Melee Parry",                   attribute: "DEX" },
  { name: "Alien Species",                 attribute: "KNO" },
  { name: "Languages",                     attribute: "KNO" },
  { name: "Planetary Systems",             attribute: "KNO" },
  { name: "Streetwise",                    attribute: "KNO" },
  { name: "Survival",                      attribute: "KNO" },
  { name: "Astrogation",                   attribute: "MEC" },
  { name: "Beast Riding",                  attribute: "MEC" },
  { name: "Repulsorlift Operation",        attribute: "MEC" },
  { name: "Space Transports",              attribute: "MEC" },
  { name: "Starfighter Piloting",          attribute: "MEC" },
  { name: "Starship Gunnery",              attribute: "MEC" },
  { name: "Bargain",                       attribute: "PER" },
  { name: "Con",                           attribute: "PER" },
  { name: "Gambling",                      attribute: "PER" },
  { name: "Search",                        attribute: "PER" },
  { name: "Sneak",                         attribute: "PER" },
  { name: "Brawling",                      attribute: "STR" },
  { name: "Climbing/Jumping",              attribute: "STR" },
  { name: "Stamina",                       attribute: "STR" },
  { name: "Computer Programming/Repair",   attribute: "TEC" },
  { name: "Droid Programming",             attribute: "TEC" },
  { name: "Droid Repair",                  attribute: "TEC" },
  { name: "First Aid",                     attribute: "TEC" },
  { name: "Medicine",                      attribute: "TEC" },
  { name: "Space Transports Repair",       attribute: "TEC" },
  { name: "Starfighter Repair",            attribute: "TEC" },
];

export default class CharacterActor extends Actor {
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (userId !== game.user.id) return;

    const itemData = DEFAULT_SKILLS.map(skill => ({
      name: skill.name,
      type: "skill",
      system: { attribute: skill.attribute, rank: 0 }
    }));

    await this.createEmbeddedDocuments("Item", itemData);
  }
}
