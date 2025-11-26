import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoRoomPlan.types';

type ExpoRoomPlanModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoRoomPlanModule extends NativeModule<ExpoRoomPlanModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoRoomPlanModule, 'ExpoRoomPlanModule');
