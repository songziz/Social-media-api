import * as express from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const app = express();
const firestore = admin.firestore();
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

const authentication = async (req: express.Request, res: express.Response, next: () => any) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken : string = req.headers.authorization.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(idToken);
    next();
    return;
  } catch(error) {
    res.status(403).send('Unauthorized');
    return;
  }
}

app.use(authentication);

exports.widgets = functions.https.onRequest(app);
/**
 * TODO(developer): Uncomment the following line to run this code.
 */
// const text = 'Your text to analyze, e.g. Hello, world!';

// Prepares a document, representing the provided text
const document = {
  content: text,
  type: 'PLAIN_TEXT',
};

// Detects entities in the document
const [result] = await client.analyzeEntities({document});

const entities = result.entities;

console.log('Entities:');
entities.forEach(entity => {
  console.log(entity.name);
  console.log(` - Type: ${entity.type}, Salience: ${entity.salience}`);
  if (entity.metadata && entity.metadata.wikipedia_url) {
    console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}`);
  }
});