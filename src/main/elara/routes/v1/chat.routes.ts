import { Router } from 'express';
import {
  getAccountConversations,
  getAccountConversationDetail,
  deleteAccountConversation,
} from '../../controllers/chat.controller';

const router = Router();

router.get('/accounts/:accountId/conversations', getAccountConversations);
router.get(
  '/accounts/:accountId/conversations/:conversationId',
  getAccountConversationDetail,
);
router.delete(
  '/accounts/:accountId/conversations/:conversationId',
  deleteAccountConversation,
);

export default router;
