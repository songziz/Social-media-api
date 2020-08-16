const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

export async function extractEntity(words: string){
  let ret : [string, number][]= [];

  const document = {
    content: words,
    type: 'PLAIN_TEXT',
  };

  const [result] = await client.analyzeEntities({document});

  const entities = result.entities;
  entities.forEach((entity : any) => {
    ret.push([entity.name, entity.salience]);
  });
  return ret;
}