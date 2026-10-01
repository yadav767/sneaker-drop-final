import { Router } from 'express';
import { getOrder } from '../controllers/order.controller.js';

const router = Router();

router.get('/:orderId', getOrder);

export default router;
