import * as admin from 'firebase-admin';

/**
 *
 * @param {string} words descriptions of the event given by user
 * @return {[string, number][]} phase and rating pair
 */
export async function extractEntity(words: string){
  const language = require('@google-cloud/language');
  const client = new language.LanguageServiceClient();

  const ret : [string, number][]= [];

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

const DEFAULT_URL = 'gs://hack20-52610.appspot.com/images/pexels-ronê-ferreira-2735037.jpg'

/**
 *
 * @param {[string, number][]} query obtained from extractEntity function
 * @return {string} gs:// url that the user can retrieve from storage. See:
 * https://firebase.google.com/docs/storage/web/download-files
 */
export async function getImage(query: [string, number][]) {
  const words: string[] = [];
  query.forEach((word) => words.push(word[0].toLowerCase()));
  const imagesRef = admin.firestore().collection('images');
  const snapshot = await imagesRef.where('tags', 'array-contains', words).get();

  if (snapshot.empty) {
    return DEFAULT_URL;
  }

  const imageInfo : any = [];
  snapshot.forEach(doc => {
    imageInfo.push(doc.data());
  });

  let maxScore = -1;
  let maxIndex = 0;
  for (let i = 0; i < imageInfo.length; i++) { // each of the images
    let curScore = 0;
    for (let j = 0; j < words.length; j++) { // each of the word in query
      if (imageInfo[j].tags.contains(words[j])){ // if image tags contains the word
        curScore += imageInfo[j].tagscore.get(words[j]) * query[j][1];
      }
    }
    if (curScore > maxScore) {
      maxScore = curScore;
      maxIndex = i;
    }
  }

  return imageInfo[maxIndex].url;
}
