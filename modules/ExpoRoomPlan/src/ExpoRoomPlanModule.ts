import { NativeModule, requireNativeModule } from "expo";

import { ExpoRoomPlanModuleEvents } from "./ExpoRoomPlan.types";

declare class ExpoRoomPlanModule extends NativeModule<ExpoRoomPlanModuleEvents> {}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoRoomPlanModule>("ExpoRoomPlan");
