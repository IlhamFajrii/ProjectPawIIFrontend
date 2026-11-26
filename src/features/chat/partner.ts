import type { Conversation, UserSummary } from '../../lib/api/types';
import { idOf, objectOf } from '../../lib/url';

export function describeConversation(conversation: Conversation, userId: string) {
  const other = conversation.participants.find((participant) => idOf(participant) !== userId);
  return {
    other: objectOf<UserSummary>(other),
    listing: typeof conversation.listing === 'object' ? conversation.listing : undefined,
  };
}
