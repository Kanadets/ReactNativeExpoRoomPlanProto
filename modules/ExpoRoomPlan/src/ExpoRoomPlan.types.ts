export interface ExpoRoomPlanAvailability {
  isAvailable: boolean;
  availabilityReason?: string;
  deviceSupported: boolean;
  osVersion: string;
}

export interface ExpoRoomPlanScanResult {
  uuid?: string;
  usdzUri?: string;
  jsonUri?: string;
  timestamp?: number;
  error?: string;
}
