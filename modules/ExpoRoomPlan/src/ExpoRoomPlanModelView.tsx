import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";
import { ViewProps } from "react-native";

export type ExpoRoomPlanModelViewProps = {
  modelPath?: string;
} & ViewProps;

// Use the full namespaced name that Expo creates
const NativeView: React.ComponentType<ExpoRoomPlanModelViewProps> =
  requireNativeViewManager("ExpoRoomPlan_ExpoRoomPlanModelView");

export default function ExpoRoomPlanModelView(
  props: ExpoRoomPlanModelViewProps
) {
  return <NativeView {...props} />;
}
