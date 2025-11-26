import { NativeModule, requireNativeModule } from "expo";

import { ExpoRoomPlanAvailability } from "./ExpoRoomPlan.types";

declare class ExpoRoomPlanModule extends NativeModule {
  checkAvailability(): Promise<ExpoRoomPlanAvailability>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoRoomPlanModule>("ExpoRoomPlan");
