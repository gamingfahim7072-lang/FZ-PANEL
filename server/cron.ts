import { db } from './db.js';
import { TelegramService } from './telegram.js';

export class CronService {
  private static timer: NodeJS.Timeout | null = null;

  public static start() {
    if (this.timer) return;
    console.log('Starting SaaS background automated cron workers...');

    // Run every 60 seconds
    this.timer = setInterval(() => {
      this.runAutomatedTasks().catch(err => console.error('Cron job error:', err));
    }, 60000);

    // Initial run
    this.runAutomatedTasks().catch(err => console.error('Initial cron error:', err));
  }

  private static async runAutomatedTasks() {
    const now = new Date();
    let changesMade = false;

    // 1. Subscription Expiration Automation
    for (const sub of db.subscriptions) {
      if (sub.status === 'ACTIVE' && sub.expiry_date) {
        if (new Date(sub.expiry_date) < now) {
          sub.status = 'EXPIRED';
          sub.updated_at = now.toISOString();
          changesMade = true;

          // Push expiry notification to user
          db.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            user_id: sub.user_id,
            title: '⚠️ Subscription Expired',
            message: 'Your subscription plan has expired. Please renew to restore live bot selling and broadcast services.',
            type: 'WARNING',
            is_read: false,
            created_at: now.toISOString()
          });
        }
      }
    }

    // 2. Broadcast Queue Poller
    const queuedBroadcast = db.broadcasts.find(b => b.status === 'QUEUED');
    if (queuedBroadcast) {
      TelegramService.executeBroadcast(queuedBroadcast.id).catch(err =>
        console.error(`Failed executing broadcast ${queuedBroadcast.id}:`, err)
      );
    }

    if (changesMade) {
      db.saveImmediately();
    }
  }

  public static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
