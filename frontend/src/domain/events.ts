import type { EventModel } from "@/api/adapters/event";
import type { EventState } from "@/types/state";

export type EventKind = EventModel["kind"];
type EventStateInput = Pick<EventModel, "due" | "isCompleted">;

interface EventPresentation {
  nameKey: string;
  descriptionKey: string;
  dateLabelKey: string;
  dueLabelKey: string;
  supportsCompletion: boolean;
  completionPatch: (completed: boolean) => boolean | undefined;
  state: (event: EventStateInput, now: number) => EventState;
}

export const EVENT_PRESENTATIONS = {
  DEADLINE: {
    nameKey: "scopes.deadline.kind.DEADLINE",
    descriptionKey: "scopes.deadline.kind-description.DEADLINE",
    dateLabelKey: "scopes.common.form-labels.due-date",
    dueLabelKey: "scopes.common.due",
    supportsCompletion: true,
    completionPatch: (completed) => completed,
    state: (event, now) => {
      if (event.isCompleted) return "completed";
      return now > event.due ? "overdue" : "open";
    },
  },
  ALERT: {
    nameKey: "scopes.deadline.kind.ALERT",
    descriptionKey: "scopes.deadline.kind-description.ALERT",
    dateLabelKey: "scopes.deadline.alert-date",
    dueLabelKey: "scopes.deadline.alert-date",
    supportsCompletion: false,
    completionPatch: (_completed) => undefined,
    state: (event, now) => (now >= event.due ? "occurred" : "upcoming"),
  },
} satisfies Record<EventKind, EventPresentation>;
