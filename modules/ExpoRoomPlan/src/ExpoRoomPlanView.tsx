import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoRoomPlanViewProps } from './ExpoRoomPlan.types';

const NativeView: React.ComponentType<ExpoRoomPlanViewProps> =
  requireNativeView('ExpoRoomPlan');

export default function ExpoRoomPlanView(props: ExpoRoomPlanViewProps) {
  return <NativeView {...props} />;
}
