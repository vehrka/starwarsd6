const DEFAULT_SKILLS = [
  { name: "Blaster",                attribute: "DEX" },
  { name: "Brawling Parry",         attribute: "DEX" },
  { name: "Dodge",                  attribute: "DEX" },
  { name: "Grenade",                attribute: "DEX" },
  { name: "Hvy Weapons",            attribute: "DEX" },
  { name: "Melee",                  attribute: "DEX" },
  { name: "Alien Races",            attribute: "KNO" },
  { name: "Bureaucracy",            attribute: "KNO" },
  { name: "Culture",                attribute: "KNO" },
  { name: "Languages",              attribute: "KNO" },
  { name: "Planets",                attribute: "KNO" },
  { name: "Streetwise",             attribute: "KNO" },
  { name: "Survival",               attribute: "KNO" },
  { name: "Technology",             attribute: "KNO" },
  { name: "Astrogation",            attribute: "MEC" },
  { name: "Beast Riding",           attribute: "MEC" },
  { name: "Repulsorlift Operation", attribute: "MEC" },
  { name: "Ship Weapons",           attribute: "MEC" },
  { name: "Ship Pilot",             attribute: "MEC" },
  { name: "Ship Shields",           attribute: "MEC" },
  { name: "Bargain",                attribute: "PER" },
  { name: "Command",                attribute: "PER" },
  { name: "Con",                    attribute: "PER" },
  { name: "Gambling",               attribute: "PER" },
  { name: "Hide/Sneak",             attribute: "PER" },
  { name: "Search",                 attribute: "PER" },
  { name: "Brawling",               attribute: "STR" },
  { name: "Climb/Jump",             attribute: "STR" },
  { name: "Lifting",                attribute: "STR" },
  { name: "Stamina",                attribute: "STR" },
  { name: "Swimming",               attribute: "STR" },
  { name: "Computers",              attribute: "TEC" },
  { name: "Demolitions",            attribute: "TEC" },
  { name: "Droids",                 attribute: "TEC" },
  { name: "Medicine",               attribute: "TEC" },
  { name: "Repair",                 attribute: "TEC" },
  { name: "Security",               attribute: "TEC" },
];

export default class CharacterActor extends Actor {
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (userId !== game.user.id) return;
    if (this.type !== "character") return;

    const itemData = DEFAULT_SKILLS.map(skill => ({
      name: skill.name,
      type: "skill",
      system: { attribute: skill.attribute, rank: 0 }
    }));

    await this.createEmbeddedDocuments("Item", itemData);
  }
}
