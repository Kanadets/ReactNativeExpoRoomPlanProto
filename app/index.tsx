import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import ExpoRoomPlanModule, {
  ExpoRoomPlanAvailability,
} from "@/modules/ExpoRoomPlan";

export default function Index() {
  const [availability, setAvailability] =
    useState<ExpoRoomPlanAvailability | null>(null);

  useEffect(() => {
    ExpoRoomPlanModule.checkAvailability().then(setAvailability);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>{availability?.isAvailable ? "Available" : "Not available"}</Text>
      <Text>{availability?.availabilityReason}</Text>
      <Text>
        {availability?.deviceSupported ? "Supported" : "Not supported"}
      </Text>
      <Text>{availability?.osVersion}</Text>
    </View>
  );
}
