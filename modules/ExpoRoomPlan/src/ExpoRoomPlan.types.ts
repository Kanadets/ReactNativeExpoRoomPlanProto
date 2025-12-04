export interface ExpoRoomPlanAvailability {
  isAvailable: boolean;
  availabilityReason?: string;
  deviceSupported: boolean;
  osVersion: string;
}

export type ExpoRoomPlanScanResult = {
  usdzUri?: string;
  jsonUri?: string;
  totalRooms?: number;
  error?: string;
};
