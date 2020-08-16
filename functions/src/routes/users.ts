import * as express from 'express';
import {
  getUser,
  createUser,
  updateTags,
  deleteUser,
  joinEvent,
  sendFriendRequest,
  acceptFriendRequest,
} from '../controllers/users';

const router : express.Router = express.Router();

router.get('/:uid', getUser);

router.post('/', createUser);

router.patch('/:uid', updateTags);

router.delete('/:uid', deleteUser);

router.post('/:uid/requests/send', sendFriendRequest);

router.post('/:uid/requests/accept', acceptFriendRequest);

router.post('/:uid/events/', joinEvent);

export default router;