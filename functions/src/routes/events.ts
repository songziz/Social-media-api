import * as express from 'express';
import { createEvent } from '../controllers/events';

const router : express.Router = express.Router();

router.post('/', createEvent);

router.get('/:uid', getEvent);

export default router;
