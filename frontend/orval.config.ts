import { defineConfig, type Options } from "orval";

export const deadlinesOptions = {
  input: "../api/openapi.json",
  output: {
    target: "./src/api/generated/endpoints/api.ts",
    schemas: "./src/api/generated/models",
    mode: "tags-split",
    client: "pinia-colada",
    httpClient: "fetch",
    clean: true,
    formatter: "biome",
    tsconfig: "./tsconfig.app.json",
    packageJson: "./package.json",
    baseUrl: {
      runtime: '(import.meta.env?.VITE_API_BASE_URL ?? "").replace(/\\/$/, "")',
    },
    override: {
      useDates: false,
      useDatesTransform: false,
      fetch: {
        includeHttpResponseReturnType: false,
        forceSuccessResponse: true,
      },
      operations: {
        createAttachment: {
          formData: {
            path: "./src/api/serialization/attachmentFormData.ts",
            name: "createAttachmentFormData",
          },
        },
      },
    },
  },
} satisfies Options;

export default defineConfig({ deadlines: deadlinesOptions });
