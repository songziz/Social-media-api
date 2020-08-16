import * as express from 'express';
import * as admin from 'firebase-admin';
import User from '../util/user';

/**
 * GET a specific user based on their UID. Returns a User object in the body
 * of the request.
 *
 * @param req express request with the uid of the user desired as a parameter
 * in the path ie. /:uid
 * @param res express response with an object in the body that looks like: {
 *    username: string,
 *    icon: string,
 *    friendRequests: [string[], string[]],
 * }.
 */
export const getUser = (req: express.Request, res: express.Response) => {
  if (!req.params.uid) {
    res.sendStatus(400);
    return;
  }

  const uid : string = req.params.uid;
  
  admin.firestore().collection('users').doc(uid).get().then(function(doc) {
    if (doc.exists) {
      const data = doc.data();
      const result = {
        username: data!.username,
        icon: data!.icon,
        friendRequests: User.friendRequestsFromFS(data!.friendRequests),
      };
      res.status(200).json(result);
    } else {
      res.sendStatus(404);
    }
  }).catch((error) => res.status(500).send(error.message));

  admin.firestore().collection
};

/**
 * 
 * @param req express request with the body looking like : {
 *    info: {
 *      username: string,
 *      icon: string,
 *      uid: string,
 *    }
 * }
 * @param res express response with body of type User representing the newly created
 * user.
 */
export const createUser = (req: express.Request, res: express.Response) => {
  if (!req.body.info || !req.body.info.username || !req.body.info.icon ||
      !req.body.info.uid) {
    res.sendStatus(400);
  }

  const {info} = req.body;

  let newUser : any = {
    username: info.username,
    icon: info.icon,
    uid: info.uid,
    tags: {},
  }

  admin.firestore().collection('users').doc(newUser.uid).set(newUser)
  .then(function() {
    const result = {
      username: newUser.username,
      uid: newUser.uid,
      icon: newUser.icon,
    }
    res.status(201).json(result);
  }).catch(function(error) {
    res.status(500).send(error.message);
  });
};

/**
 * Updates a user's tags for their preferences
 * @param req express requrest with a body that has a property called "tags" that updates the tags
 * of the user. And has the uid in the path parameters
 * 
 * @param res express request with the response code.
 */
export const updateTags = (req: express.Request, res: express.Response) => {
  if (!req.body.tags || !req.params.uid) {
    res.sendStatus(400);
    return;
  }

  const {uid} = req.params;


  admin.firestore().collection('users').doc(uid).set({tags: req.body.tags}, {merge: true})
    .then(function() {
      res.sendStatus(201)
    })
    .catch(function(error) {
      res.status(500).send(error.message);
    });
};

/**
 * Deletes a user from the database
 * @param req express request with a uid in the path parameters
 * @param res express request with status representing the result of the transaction
 */
export const deleteUser = (req: express.Request, res: express.Response) => {
  if (!req.params.uid) {
    res.sendStatus(400);
    return;
  }

  const uid : string = req.params.uid;

  admin.firestore().collection('users').doc(uid).delete()
    .then(() => res.sendStatus(200))
    .catch((error) => res.status(500).send(error.message));
};

/**
 * Sends a friend request from one user to another.
 * 
 * @param req an express request with the sender's uid in the path params and the 
 * recipient user in the query params
 * @param res an express response with status 201 if successful
 */
export const sendFriendRequest = async (req: express.Request, res: express.Response) => {
  if (!req.params.uid || !req.query.toUid) {
    res.sendStatus(400);
    return; 
  }

  const fromUid = req.params.uid;
  const toUid = req.query.toUid as string;

  const from = admin.firestore().collection('users').doc(fromUid);
  const to = admin.firestore().collection('users').doc(toUid);
  
  try { 
    const fromData : any = await from.get().then((doc) => doc.data());
    const toData : any = await to.get().then((doc) => doc.data());
    
    await from.collection('fromRequests').doc(fromUid).set({username: toData.username, icon: toData.icon});
    await to.collection('toRequests').doc(toUid).set({username: fromData.username, icon: fromData.icon});

    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

/**
 * accept friend request from one user to another.
 * 
 * @param req the friend that is accepting the request's id must be in the path params and the sender's
 * id must be in the query params with name "fromUid"
 * @param res 
 */
export const acceptFriendRequest = async (req: express.Request, res: express.Response) => {
  if (!req.params.uid || !req.query.fromUid) {
    res.sendStatus(400);
    return;
  }

  const toUid = req.params.uid;
  const fromUid = req.query.fromUid as string;

  try {
    await admin.firestore().runTransaction(async () => {
      const from = admin.firestore().collection('users').doc(fromUid);
      const to = admin.firestore().collection('users').doc(toUid);
  
      const toData = await from.collection('fromRequests').doc(toUid).get().then((doc) => doc.data());
      const fromData = await to.collection('toRequests').doc(fromUid).get().then((doc) => doc.data());
  
      await from.collection('friends').doc(toUid).set(toData!);
      await to.collection('friends').doc(fromUid).set(fromData!);
  
      from.collection('fromRequests').doc(toUid).delete();
      to.collection('toRequests').doc(fromUid).delete();
  
      res.sendStatus(201);
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

  /**
   * Adds the user to the line for the event.
   * 
   * @param req request with the uid of the user in the path params and the event uid in the
   * query params with name "event".
   * @param res 
   */
  export const joinEvent = async (req: express.Request, res: express.Response) => {
    if (!req.params.uid || !req.query.event) {
      res.sendStatus(400);
      return;
    }

    const {uid} = req.params;
    const eventId = req.query.event as string;

    await admin.firestore().runTransaction(async () => {
      const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
  
      const data = eventDoc.data()!;
  
      const slots: string[] = data.slots;
  
      if (slots.length > 9) {
        return Promise.reject('The event is full');
      }

      const eventSummary : any = {
        createdBy: data.createdBy,
        name: data.name,
        uid: eventId,
        current: true,
      }
  
      slots.push(uid);
  
      let icons : string[] = [];
      if (slots.length !== 1) { // get previous users' icons if they are there
        await admin.firestore().collection('users').doc(slots[0]).collection('events').doc(eventId).get()
          .then((doc) => {
            if (doc.exists) {
              icons = doc.data()!.slots;
            }
          });
      }

      // get newest user's icon
      await admin.firestore().collection('users').doc(uid).get().then((doc) => {
        if (doc.exists) {
          icons.push(doc.data()!.icon);
        }
      });
  
      eventSummary.slots = icons; 

      await admin.firestore().collection('events').doc(eventId).set({slots: slots}, {merge: true});
      
      for (const id of slots) {
        await admin.firestore().collection('users').doc(id).collection('events')
          .doc(eventId).set(eventSummary);
      }
      return Promise.resolve();
    }).then(() => res.sendStatus(201)).catch((error) => res.status(500).send(error.message));
  };

