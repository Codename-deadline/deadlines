import type { Deadline } from "@/api/schemas/deadline/common/Deadline";
import type { DeadlineState } from "@/types/state";

export const computeDeadlineState = (deadline: Deadline): DeadlineState => {
  if (deadline.isCompleted) return "completed";
  if (Date.now() > deadline.due) return "overdue";
  return "open";
};
