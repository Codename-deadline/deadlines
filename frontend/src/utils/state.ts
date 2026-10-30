import type { DeadlineModel } from "@/api/adapters/deadline";
import type { DeadlineState } from "@/types/state";

export const computeDeadlineState = (deadline: Pick<DeadlineModel, "due" | "isCompleted">): DeadlineState => {
  if (deadline.isCompleted) return "completed";
  if (Date.now() > deadline.due) return "overdue";
  return "open";
};
