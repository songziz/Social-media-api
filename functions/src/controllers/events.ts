import * as admin from 'firebase-admin';
import * as express from 'express';
import {extractEntity, getImage} from './entity-extraction';

export const createEvent = async (req: express.Request, res: express.Response) => {
  if (!req.body.event || !req.body.event.username
      || !req.body.event.name || !req.body.event.description) {
    res.sendStatus(400);
    return;
  }

  const {event} = req.body;

  const tags = await extractEntity(event.description);
  const imageUrl = getImage(tags);

  const newTags : any = {};
  for (const tag of tags) {
    newTags[tag[0]] = tag[1];
  }

  const data = {
    createdBy: event.username,
    description: event.description,
    name: event.name,
    tags: newTags,
    image: imageUrl,
    slots: [],
    postedOn: new Date().toString(),
  };

  try {
    await admin.firestore().runTransaction(async () => {
      const userDoc = admin.firestore().collection('users').doc(event.createdBy);

      const userDataTags = await userDoc.get().then(doc => doc.data()!.tags);

      for (const key of Object.keys(newTags)) {
        if (userDataTags[key] === undefined) {
          userDataTags[key] = 0;
        }

        userDataTags[key] = userDataTags[key] + newTags[key];
      }

      const eventId = await admin.firestore().collection('events').add(data).then((doc) => doc.id);

      const summaryData = {
        createdBy: data.createdBy,
        current: false,
        name: data.name,
        slots: data.slots,
        uid: eventId,
        username: event.username,
      }

      await userDoc.collection('events').doc(eventId).set(summaryData);
    });
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}


// getEvent

export const getEvent = (req: express.Request, res: express.Response) => {
  if (!req.params.uid) {
    res.sendStatus(400);
    return;
  }

  const uid : string = req.params.uid;

  admin.firestore().collection('events').doc(uid).get().then(function(doc) {
    if (doc.exists) {
      const data = doc.data();
      const result = {
        createdBy: data!.createdBy,
        description: data!.description,
        image: data!.image,
        name:data!.name,
        postedOn:data!.postedOn,
        slots:data!.slots,
        username: data!.username,
        uid: uid,
      };
      res.status(200).json(result);
    } else {
      res.sendStatus(404);
    }
  }).catch((error) => res.status(500).send(error.message));
};