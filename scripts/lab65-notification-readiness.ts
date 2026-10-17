import { notificationReadiness } from '../server/concepts/65-human-approval.js';
console.log(JSON.stringify({ providerCalls: 0, channels: notificationReadiness() }, null, 2));
