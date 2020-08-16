import * as express from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const app = express();

import authentication from './controllers/authentication';
import Users from './routes/users';

app.use(authentication);

app.use(Users);

exports.widgets = functions.https.onRequest(app);