import { refDebounced, useWindowSize } from "@vueuse/core";
import { computed, type MaybeRefOrGetter, shallowRef, toValue, watch } from "vue";

export type MemberPagination = { page: number; size: number };

export const MOBILE_LANDSCAPE_PAGE_SIZE: number = 2;
export const MOBILE_PORTRAIT_PAGE_SIZE: number = 5;
export const DESKTOP_PAGE_SIZE: number = 5;

/** Keep API pages, rendered rows and placeholders in sync across viewport changes. */
export function useMemberPagination(entityId: MaybeRefOrGetter<number>) {
  const { width, height } = useWindowSize();
  const viewportSize = computed(() => {
    const isMobileLandscape = width.value < 1024 && height.value < 640 && width.value > height.value;
    if (height.value < 550 || isMobileLandscape) return MOBILE_LANDSCAPE_PAGE_SIZE;
    if (width.value < 640 || height.value < 900) return MOBILE_PORTRAIT_PAGE_SIZE;
    return DESKTOP_PAGE_SIZE;
  });

  const settledSize = refDebounced(viewportSize, 150);
  const pagination = shallowRef<MemberPagination>({ page: 0, size: viewportSize.value });

  watch(
    settledSize,
    (size) => {
      const current = pagination.value;
      pagination.value = { page: Math.floor((current.page * current.size) / size), size };
    },
    { flush: "sync" },
  );
  watch(
    () => toValue(entityId),
    () => {
      pagination.value = { ...pagination.value, page: 0 };
    },
    { flush: "sync" },
  );

  const page = computed({
    get: () => pagination.value.page,
    set: (page: number) => {
      pagination.value = { ...pagination.value, page };
    },
  });
  const pageSize = computed(() => pagination.value.size);
  // Call only for a resolved response; pending queries do not have a page count yet.
  const clampPage = (totalPages: number) => {
    if (page.value >= totalPages) page.value = Math.max(0, totalPages - 1);
  };

  return { pagination: computed(() => pagination.value), page, pageSize, clampPage };
}
