<script setup lang="ts">
import { NDatePicker, NRadio, NRadioGroup, NSelect } from "naive-ui";
import { Temporal } from "temporal-polyfill";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { instantToWallTime, resolveWallTime, type WallTimeCandidate } from "@/utils/date";

const props = defineProps<{
  disabled?: boolean;
  timeZone: string;
}>();
const model = defineModel<number | null>("value", { required: true });
const { t } = useI18n();

const datePart = ref<string | null>(null);
const hour = ref<number | null>(null);
const minute = ref<number | null>(null);
const validationError = ref<"invalid" | "nonexistent" | null>(null);
const candidates = ref<WallTimeCandidate[]>([]);
const selectedCandidate = ref<number | null>(null);

const hourOptions = Array.from({ length: 24 }, (_, value) => ({ label: String(value).padStart(2, "0"), value }));
const minuteOptions = Array.from({ length: 60 }, (_, value) => ({ label: String(value).padStart(2, "0"), value }));

watch(
  [() => model.value, () => props.timeZone],
  ([instant]) => {
    if (instant === null) return;
    const wallTime = instantToWallTime(instant, props.timeZone);
    datePart.value = wallTime.toPlainDate().toString();
    hour.value = wallTime.hour;
    minute.value = wallTime.minute;
  },
  { immediate: true },
);

const resolveSelection = () => {
  validationError.value = null;
  candidates.value = [];
  selectedCandidate.value = null;

  if (datePart.value === null || hour.value === null || minute.value === null) {
    model.value = null;
    return;
  }

  try {
    const date = Temporal.PlainDate.from(datePart.value);
    const plainDateTime = Temporal.PlainDateTime.from({
      year: date.year,
      month: date.month,
      day: date.day,
      hour: hour.value,
      minute: minute.value,
    });
    const resolved = resolveWallTime(plainDateTime, props.timeZone);
    if (resolved.length === 0) {
      validationError.value = "nonexistent";
      model.value = null;
      return;
    }
    if (resolved.length > 1) {
      candidates.value = resolved;
      model.value = null;
      return;
    }
    model.value = resolved[0]!.instant;
  } catch {
    validationError.value = "invalid";
    model.value = null;
  }
};

const handleDateUpdate = (value: string | null) => {
  datePart.value = value;
  resolveSelection();
};

const handleHourUpdate = (value: number | null) => {
  hour.value = value;
  resolveSelection();
};

const handleMinuteUpdate = (value: number | null) => {
  minute.value = value;
  resolveSelection();
};

const handleCandidateSelection = (instant: number) => {
  selectedCandidate.value = instant;
  model.value = instant;
};
</script>

<template>
  <div class="w-full min-w-0">
    <div class="grid grid-cols-[minmax(0,1fr)_5rem_auto_5rem] items-center gap-2">
      <n-date-picker
        :disabled="disabled"
        :formatted-value="datePart"
        type="date"
        value-format="yyyy-MM-dd"
        class="min-w-0"
        @update:formatted-value="handleDateUpdate"
      />
      <n-select
        :disabled="disabled"
        :options="hourOptions"
        :value="hour"
        @update:value="handleHourUpdate"
      />
      <span aria-hidden="true">:</span>
      <n-select
        :disabled="disabled"
        :options="minuteOptions"
        :value="minute"
        @update:value="handleMinuteUpdate"
      />
    </div>
    <p class="description mt-1 text-xs">
      {{ t("scopes.deadline.date-picker.time-zone", { timeZone }) }}
    </p>
    <p v-if="validationError" class="mt-1 text-sm text-status-error/80">
      {{ t(`scopes.deadline.date-picker.${validationError}`) }}
    </p>
    <div v-if="candidates.length" class="mt-2 rounded-lg border border-current/15 p-3">
      <p class="mb-2 text-sm">{{ t("scopes.deadline.date-picker.ambiguous") }}</p>
      <n-radio-group
        :value="selectedCandidate"
        class="flex flex-col gap-2"
        @update:value="handleCandidateSelection"
      >
        <n-radio v-for="(candidate, index) in candidates" :key="candidate.instant" :value="candidate.instant">
          {{ t(`scopes.deadline.date-picker.${index === 0 ? "earlier" : "later"}`, { offset: candidate.offset }) }}
        </n-radio>
      </n-radio-group>
    </div>
  </div>
</template>
