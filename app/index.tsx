import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule, {
  ExpoRoomPlanAvailability,
  ExpoRoomPlanView,
} from "@/modules/ExpoRoomPlan";

import { OnScanCompleteEvent } from "@/modules/ExpoRoomPlan/src/ExpoRoomPlanView";

export default function Index() {
  const insets = useSafeAreaInsets();

  const [availability, setAvailability] =
    useState<ExpoRoomPlanAvailability | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanName, setScanName] = useState("Untitled Scan");

  useEffect(() => {
    ExpoRoomPlanModule.checkAvailability().then(setAvailability);
  }, []);

  const handleScanNameChange = (text: string) => {
    setScanName(text);
  };

  const handleScanComplete = (
    event: NativeSyntheticEvent<OnScanCompleteEvent>
  ) => {
    console.log("UUID:", event.nativeEvent);
    setIsProcessing(false);
    setScanning(false);
  };

  console.log("isProcessing", isProcessing);
  console.log("scanning", scanning);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.status}>
          {availability?.isAvailable ? "Available" : "Not available"}
        </Text>

        {!availability?.isAvailable && (
          <Text>{availability?.availabilityReason}</Text>
        )}

        {availability?.isAvailable && (
          <>
            <TextInput
              style={styles.scanNameInput}
              value={scanName}
              onChangeText={handleScanNameChange}
              placeholder="Enter scan name"
            />
            <Button
              title={isProcessing ? "Processing..." : "Start Room Plan Scan"}
              disabled={isProcessing}
              onPress={() => setScanning(true)}
            />
          </>
        )}
      </View>

      {/* Show the scanner in a Modal or full screen */}
      <Modal visible={scanning} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <ExpoRoomPlanView
            style={{ flex: 1 }}
            scanName={scanName}
            onScanProcessing={() => setIsProcessing(true)}
            onScanComplete={handleScanComplete}
          />

          <View
            style={[
              styles.overlay,
              { paddingTop: insets.top, paddingHorizontal: 10 },
            ]}
          >
            <Text style={styles.scanName}>{scanName}</Text>
            <Button
              title={isProcessing ? "Processing..." : "Close / Cancel"}
              disabled={isProcessing}
              onPress={() => setScanning(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  status: { fontSize: 18, marginBottom: 20 },
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.8)",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  scanNameInput: {
    height: 40,
    width: "50%",
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  scanName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
});
