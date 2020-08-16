import * as express from 'express';
import * as admin from 'firebase-admin';

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
        uid: uid,
      };
      res.status(200).json(result);
    } else {
      res.sendStatus(404);
    }
  }).catch((error) => res.status(500).send(error.message));
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

  const newUser : any = {
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
    await admin.firestore().runTransaction(async () => {
      const fromData : any = await from.get().then((doc) => doc.data());
      const toData : any = await to.get().then((doc) => doc.data());
      
      await from.collection('fromRequests').doc(toUid).set({username: toData.username, icon: toData.icon});
      await to.collection('toRequests').doc(fromUid).set({username: fromData.username, icon: fromData.icon});
    });

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

      const toProf = await to.get().then(((doc) => doc.data()!));
      const fromProf = await from.get().then((doc) => doc.data()!);
      
      const toResult = {
        ...toData,
        uid : toUid,
        tags: toProf.tags,
      }

      const fromResult = {
        ...fromData,
        uid: fromUid,
        tags: fromProf.tags,
      }

      await from.collection('friends').doc(toUid).set(toResult);
      await to.collection('friends').doc(fromUid).set(fromResult);

      await from.collection('fromRequests').doc(toUid).delete();
      await to.collection('toRequests').doc(fromUid).delete();

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
        username: data.username,
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


  export const leaveEvent = async (req: express.Request, res: express.Response) => {
    if (!req.params.uid || !req.query.event) {
      res.sendStatus(400);
      return;
    }

    const uid = req.params.uid;
    const eventId = req.query.event as string;

    try {
      await admin.firestore().runTransaction(async () => {
        const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
        const eventData = eventDoc.data()!;
        const slots = eventData.slots;
  
        const index = slots.indexOf(uid);
        const newSlots = slots.filter((val: any, idx: number) => idx !== index);
  
        let newIcons : string[];
        if (newSlots.length !== 0) {
          const document = await admin.firestore().collection('users').doc(newSlots[0]).collection('events').doc(eventId).get();
          const data = document.data()!;
  
          newIcons = data.slots.filter((val: any, idx: number) => idx !== index);
        } else {
          newIcons = [];
        }
  
        const eventSummary : any = {
          createdBy: eventData.createdBy,
          name: eventData.name,
          uid: eventId,
          current: true,
          username: eventData.username,
          slots: newIcons,
        }
  
        for (const id of newSlots) {
          await admin.firestore().collection('users').doc(id).collection('events').doc(eventId).set(eventSummary);
        }

        await admin.firestore().collection('users').doc(uid).collection('events').doc(eventId).delete();

        await admin.firestore().collection('events').doc(eventId).set({slots: newSlots}, {merge: true});
  
      });
      res.sendStatus(200);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  export const getRecents = async (req : express.Request, res: express.Response) => {
    if (!req.params.uid) {
      res.sendStatus(400);
      return;
    }

    const uid = req.params.uid;
    
    let recents : any;
    try {
      recents = await admin.firestore().collection('users').doc(uid).collection('events').where('current', '==', true).get();
    } catch (error) {
      res.status(500).send(error.message);
      return;
    }

    const result : any[] = [];

    recents.forEach((doc : admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      result.push({
        slots: data.slots,
        username: data.username,
        uid: data.uid,
        name: data.name,
        createdBy: data.name,
      });
    });

    res.status(200).json(result);
  }

  export const getRequests = async (req: express.Request, res: express.Response) => {
    if (!req.params.uid) {
      res.sendStatus(400);
      return;
    }

    const uid = req.params.uid;

    try {
      await admin.firestore().runTransaction(async () => {
        const doc = admin.firestore().collection('users').doc(uid);
        const toReq = await doc.collection('toRequests').get();
        const fromReq = await doc.collection('fromRequests').get();

        const toResult : any[] = [];
        toReq.docs.forEach((document) => {
          if (document.id !== 'INIT_DOCUMENT') {
            const data  = document.data();
            toResult.push({
              username: data.username,
              icon: data.icon,
              uid: doc.id,
            });
          }
        });

        const fromResult : any[] = [];
        fromReq.docs.forEach((document) => {
          if (document.id !== 'INIT_DOCUMENT') {
            const data  = document.data();
            fromResult.push({
              username: data.username,
              icon: data.icon,
              uid: doc.id,
            });
          }
        });

        res.status(200).json([toResult, fromResult]);
      }); 
    } catch (error) {
      res.status(500).send(error.message);
    }
  };

export const getFriends = async (req: express.Request, res: express.Response) => {
  if (!req.params.uid) {
    res.sendStatus(400);
    return;
  }

  const uid = req.params.uid;

  try {
    const user = admin.firestore().collection('users').doc(uid);
    const userInfo = await user.get();
    const tags = userInfo.data()!.tags; // list of tags mapped to number
    const snapshot = await user.collection('friends').get();
    const friends = snapshot.docs.map(doc => doc.data()); // array of friends

    const fScoreMap: Map<Object, number> = new Map();
    for (let i = 0; i < friends.length; i++) {
      let curScore = 0;
      for (const key of Object.keys(tags)) {
        if (Object.keys(friends[i].tags).includes(key)) {
          curScore += friends[i].tags.get(key) * tags.get(key);
        }
      }
      fScoreMap.set(friends[i], curScore)
    }

    friends.sort((a:any, b:any) => {
      return fScoreMap.get(b)! - fScoreMap.get(a)!;
    });

    res.sendStatus(201).json(friends);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

// getRequests:
// path params: uid -> uid of user
// returns the requests sent from/to a user
