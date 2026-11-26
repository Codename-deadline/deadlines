import type { EventModel } from "@/api/adapters/event";
import { EVENT_PRESENTATIONS } from "@/domain/events";
import type { EventState } from "@/types/state";

export const computeEventState = (deadline: Pick<EventModel, "due" | "isCompleted" | "kind">): EventState => {
  return EVENT_PRESENTATIONS[deadline.kind].state(deadline, Date.now());
};
