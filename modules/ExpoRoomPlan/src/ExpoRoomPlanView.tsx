import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";
import { NativeSyntheticEvent, ViewProps } from "react-native";

export type OnScanCompleteEvent = {
  uuid: string;
  error?: string;
};

export type ExpoRoomPlanViewProps = {
  scanName?: string;
  onScanComplete?: (event: NativeSyntheticEvent<OnScanCompleteEvent>) => void;
  onScanProcessing?: () => void;
} & ViewProps;

const NativeView: React.ComponentType<ExpoRoomPlanViewProps> =
  requireNativeViewManager("ExpoRoomPlan");

export default function ExpoRoomPlanView(props: ExpoRoomPlanViewProps) {
  return <NativeView {...props} />;
}
