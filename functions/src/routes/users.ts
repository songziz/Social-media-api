import * as express from 'express';
import {
  getUser,
  createUser,
  updateTags,
  joinEvent,
  sendFriendRequest,
  acceptFriendRequest,
  leaveEvent,
  getRecents,
  getRequests,
  getFriends,
  getEvents,
  getIcons,
} from '../controllers/users';

const router : express.Router = express.Router();

router.get('/:uid', getUser); // tested

router.post('/', createUser); // tested

router.patch('/:uid', updateTags); // tested

router.post('/:uid/requests/send', sendFriendRequest); // tested

router.post('/:uid/requests/accept', acceptFriendRequest); // tested

router.post('/:uid/events/join', joinEvent); // unsure
 
router.post('/:uid/events/leave', leaveEvent); // unsure

router.get('/:uid/events/recents', getRecents); // tested

router.get('/:uid/requests', getRequests); // tested

router.get('/:uid/friends', getFriends); // not sure

router.get('/:uid/events', getEvents);

router.get('/icons', getIcons);

export default router;