import * as express from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const app = express();
// const firestore = admin.firestore();
// const language = require('@google-cloud/language');
// const client = new language.LanguageServiceClient();

import authentication from './controllers/authentication';
import { getImageLabel } from './controllers/image-labeling';

import Users from './routes/users';

app.use(authentication);

app.use(Users);

const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();


exports.widgets = functions.https.onRequest(app);

exports.imageLabel = functions.storage
  .object()
  .onFinalize(async object => getImageLabel(object));