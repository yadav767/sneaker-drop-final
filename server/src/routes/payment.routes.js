import { Router } from 'express';
import { simulatePayment } from '../controllers/payment.controller.js';

const router = Router();

router.post('/simulate', simulatePayment);

export default router;
