import { sweepReservations } from '../services/reservation.service.js';

let running = false;

// Checks MongoDB every second for expired holds. If the server restarts, the next
// run simply picks up whatever expired in the meantime (no setTimeout per order).
export default function startReservationExpiryJob() {

  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await sweepReservations();
    } catch (err) {
      console.error('Expiry job failed:', err.message);
    }
    running = false;
  }, 1000);

  console.log('Reservation expiry job started');
}
