import type { Component } from "vue";

export type MainSection = "organizations" | "threads" | "deadlines" | "invitations";

export type NavigationButtonConfig = {
  section: MainSection;
  icon: Component;
};
