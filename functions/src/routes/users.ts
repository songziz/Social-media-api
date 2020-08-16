import * as express from 'express';
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserEvents,
} from '../controllers/users';

const router : express.Router = express.Router();

router.get('/:uid', getUser);

router.get('/:uid/events', getUserEvents);

router.post('/', createUser);

router.patch('/:uid', updateUser);

router.delete('/:uid', deleteUser);

export default router;