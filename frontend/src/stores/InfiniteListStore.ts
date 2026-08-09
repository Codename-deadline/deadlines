import { defineStore } from "pinia";
import { ref } from "vue";
import type { PagedResponse } from "@/api/common/PaginationResponse";
import type { DeadlineWithRole } from "@/api/schemas/deadline/common/Deadline";
import type { OrganizationWithStatsAndRole } from "@/api/schemas/organization/common/Organization";
import type { OrganizationInvitation } from "@/api/schemas/organization/invitation/Invitation";
import type { ThreadWithRole } from "@/api/schemas/thread/common/Thread";
import { DETAULT_ENTITIES_PAGE_SIZE as DEFAULT_ENTITIES_PAGE_SIZE } from "@/constants/defaults";
import type { OperationResult } from "@/types/OperationResult";

export type ListType = "organizations" | "threads" | "deadlines" | "invitations_received" | "invitations_sent";

type InfiniteListState<T extends { id: number }> = {
  items: T[];
  ids: Set<number>;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
};

// totalPages will be updated with the actual total pages from the server on first request
export const LIST_STORE_INITIAL_TOTAL_PAGES: number = Number.MAX_SAFE_INTEGER;
const initialState = <T extends { id: number }>(pageSize: number): InfiniteListState<T> => ({
  items: [],
  ids: new Set(),
  page: 0,
  pageSize,
  totalPages: LIST_STORE_INITIAL_TOTAL_PAGES,
  loading: false,
});

export const useInfiniteListStore = defineStore("infiniteList", () => {
  const stateMap = ref<
    Record<
      ListType,
      InfiniteListState<OrganizationWithStatsAndRole | ThreadWithRole | DeadlineWithRole | OrganizationInvitation>
    >
  >({
    organizations: initialState<OrganizationWithStatsAndRole>(DEFAULT_ENTITIES_PAGE_SIZE),
    threads: initialState<ThreadWithRole>(DEFAULT_ENTITIES_PAGE_SIZE),
    deadlines: initialState<DeadlineWithRole>(DEFAULT_ENTITIES_PAGE_SIZE),
    invitations_received: initialState<OrganizationInvitation>(DEFAULT_ENTITIES_PAGE_SIZE),
    invitations_sent: initialState<OrganizationInvitation>(DEFAULT_ENTITIES_PAGE_SIZE),
  });

  async function loadMore<T extends { id: number }>(
    type: ListType,
    fetcher: (page: number) => Promise<OperationResult<PagedResponse<T>>>,
  ) {
    const state: InfiniteListState<T> = stateMap.value[type] as InfiniteListState<T>;

    if (state.loading || !hasMore(type)) return;
    state.loading = true;

    try {
      const res = await fetcher(state.page);
      if (!res.ok) {
        state.totalPages = state.page;
        return;
      }

      for (const item of res.data.data) {
        if (!state.ids.has(item.id)) {
          state.items.push(item);
          state.ids.add(item.id);
        }
      }
      state.totalPages = res.data.totalPages;

      state.page++;
    } finally {
      state.loading = false;
    }
  }

  async function addOne<T extends { id: number }>(type: ListType, entity: T) {
    const state: InfiniteListState<T> = stateMap.value[type] as InfiniteListState<T>;

    if (!state.ids.has(entity.id)) {
      state.items.push(entity);
      state.ids.add(entity.id);
    }

    if (state.page * state.pageSize < state.items.length) {
      state.page++;
      state.totalPages = Math.max(state.page, state.totalPages);
    }
  }

  function hasMore<T extends { id: number }>(type: ListType): boolean {
    const state: InfiniteListState<T> = stateMap.value[type] as InfiniteListState<T>;
    return state.page < state.totalPages;
  }

  function removeItem<T extends { id: number }>(type: ListType, itemId: number) {
    const state: InfiniteListState<T> = stateMap.value[type] as InfiniteListState<T>;
    state.items = state.items.filter((i) => i.id !== itemId);
    state.ids.delete(itemId);
  }

  function $reset(type: ListType) {
    stateMap.value[type] = initialState(DEFAULT_ENTITIES_PAGE_SIZE);
  }

  return { stateMap, loadMore, addOne, removeItem, hasMore, $reset };
});
