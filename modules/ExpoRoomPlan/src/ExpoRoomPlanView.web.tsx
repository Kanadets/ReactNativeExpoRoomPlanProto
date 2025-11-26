import * as React from 'react';

import { ExpoRoomPlanViewProps } from './ExpoRoomPlan.types';

export default function ExpoRoomPlanView(props: ExpoRoomPlanViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
