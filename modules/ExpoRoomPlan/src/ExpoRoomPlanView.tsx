import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";
import { ViewProps } from "react-native";

export type ExpoRoomPlanViewProps = {
  scanName?: string;
  onScanProcessing?: () => void;
} & ViewProps;

const NativeView: React.ComponentType<ExpoRoomPlanViewProps> =
  requireNativeViewManager("ExpoRoomPlan_ExpoRoomPlanView");

export default function ExpoRoomPlanView(props: ExpoRoomPlanViewProps) {
  return <NativeView {...props} />;
}
