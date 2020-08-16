export class Event {
  name : string;
  description : string;
  postedOn : string; // string rep of the date
  slots : string[]; // fixed size, null for empty spot
  tags : string[];
  image : string;

  constructor (name : string, description : string, postedOn : string,
    slots : string[], tags : string[], image : string) {
      this.name = name;
      this.description = description;
      this.postedOn = postedOn;
      this.slots = slots;
      this.tags = tags;
      this.image = image;
    }
}