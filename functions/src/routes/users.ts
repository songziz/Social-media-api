import * as express from 'express';
import {
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/users';

const router : express.Router = express.Router();

router.get('/users/:uid', getUser);

router.post('/users', createUser);

router.patch('/users/:uid', updateUser);

router.delete('/users/:uid', deleteUser);

export default router;