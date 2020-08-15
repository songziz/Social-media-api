import * as express from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const app = express();
const firestore = admin.firestore();
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

import authentication from './controllers/authentication';

app.use(authentication);



exports.widgets = functions.https.onRequest(app);