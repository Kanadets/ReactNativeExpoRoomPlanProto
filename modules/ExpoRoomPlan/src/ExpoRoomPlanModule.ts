import { NativeModule, requireNativeModule } from "expo";
import { EventSubscription } from "react-native";

import {
  ExpoRoomPlanAvailability,
  ExpoRoomPlanScanResult,
} from "./ExpoRoomPlan.types";

declare class ExpoRoomPlanModule extends NativeModule {
  checkAvailability(): Promise<ExpoRoomPlanAvailability>;
  getRoomScans(): Promise<string[]>;
  previewScan(path: string): Promise<void>;
  readScanJson(usdzPath: string): Promise<string | null>;

  clearAllScans(): Promise<void>;

  addListener(
    eventName: "onScanComplete",
    listener: (event: ExpoRoomPlanScanResult) => void
  ): EventSubscription;

  removeAllListeners(eventName: string): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoRoomPlanModule>("ExpoRoomPlan");
