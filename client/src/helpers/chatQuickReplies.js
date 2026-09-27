import { FileSearch, Users, Search, HelpCircle } from 'lucide-react';

/**
 * Shared quick-reply suggestions shown in both the floating ChatWidget and
 * the full ChatPage. Clicking one just sends its `text` as the next user
 * message — no special stateful flow (Phase 3 conversational report filing
 * isn't built yet), so these are conversation starters, not a form wizard.
 */
export const QUICK_REPLIES = [
    { icon: FileSearch, text: 'নিখোঁজ রিপোর্ট করতে চাই', desc: 'নতুন রিপোর্ট দাখিল করুন' },
    { icon: Users, text: 'উদ্ধার তথ্য শেয়ার করতে চাই', desc: 'কারো সন্ধান পেলে জানান' },
    { icon: Search, text: 'নিখোঁজ পোস্ট খুঁজছি', desc: 'পোস্ট ও তথ্য অনুসন্ধান করুন' },
    { icon: HelpCircle, text: 'সাধারণ জিজ্ঞাসা', desc: 'সচরাচর জিজ্ঞাসিত প্রশ্ন' },
];
