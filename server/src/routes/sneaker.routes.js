import { Router } from 'express';
import { buy, createUser, getSale, getStatus } from '../controllers/sneaker.controller.js';

const router = Router();

router.post('/users', createUser);
router.get('/sale', getSale);
router.post('/buy', buy);
router.get('/status/:userId', getStatus);

export default router;
