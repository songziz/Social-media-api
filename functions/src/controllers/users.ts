import * as express from 'express';
import * as admin from 'firebase-admin';
import User from '../util/user';

/**
 * GET a specific user based on their UID. Returns a User object in the body
 * of the request.
 *
 * @param req express request with the uid of the user desired as a parameter
 * in the path ie. /:uid
 * @param res express response with the desired User object in the body.
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
      const result : User = {
        username: data!.username,
        friends: data!.friends,
        events: data!.events,
        tags: data!.tags,
        icon: data!.icon,
        uid: data!.uid,
        friendRequests: User.friendRequestsFromFS(data!.friendRequests),
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

  let newUser : any = {
    username: info.username,
    icon: info.icon,
    uid: info.uid,
    friendRequests: {
      incoming: [],
      outgoing: [],
    },
    friends: [],
    events: [],
    tags: {},
  }

  admin.firestore().collection('users').doc(newUser.uid).set(newUser)
  .then(function() {
    newUser.friendRequests = User.friendRequestsFromFS(newUser.friendRequests);
    res.status(201).json(newUser);
  }).catch(function(error) {
    res.status(500).send(error.message);
  });
};

/**
 * Updates a user's information
 * @param req express requrest with a body that has a propert called "info" that holds
 * either complete or partial User information. Url params must have uid.
 * 
 * @param res express request with the response code.
 */
export const updateUser = (req: express.Request, res: express.Response) => {
  if (!req.params.uid || !req.body.info) {
    res.sendStatus(400);
    return;
  }

  const {info} = req.body;
  const uid : string = req.params.uid;

  if (info.friendRequests !== undefined) {
    info.friendRequests = User.friendRequestsToFS(info.friendRequests);
  }

  admin.firestore().collection('users').doc(uid).set(info)
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

