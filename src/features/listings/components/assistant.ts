/** Slot di form listing untuk pembantu pengisian, dirakit di lapisan app. */
export interface AssistantProps {
  current: { title: string; description: string; category: string };
  apply: (values: Partial<{ title: string; description: string; category: string }>) => void;
}
