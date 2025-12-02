// Reexport the native module. On web, it will be resolved to ExpoRoomPlanModule.web.ts
// and on native platforms to ExpoRoomPlanModule.ts
export * from "./src/ExpoRoomPlan.types";
// export { default as ExpoRoomPlanModelView } from "./src/ExpoRoomPlanModelView";
export { default } from "./src/ExpoRoomPlanModule";
export { default as ExpoRoomPlanView } from "./src/ExpoRoomPlanView";
