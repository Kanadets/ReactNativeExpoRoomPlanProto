import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule, {
  ExpoRoomPlanAvailability,
  ExpoRoomPlanScanResult,
  ExpoRoomPlanView,
} from "@/modules/ExpoRoomPlan";

export default function Index() {
  const insets = useSafeAreaInsets();

  console.log("ExpoRoomPlanModule");

  const [availability, setAvailability] =
    useState<ExpoRoomPlanAvailability | null>(null);
  const [scans, setScans] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanName, setScanName] = useState("My Room");

  useEffect(() => {
    checkSetup();
  }, []);

  useEffect(() => {
    const subscription = ExpoRoomPlanModule.addListener(
      "onScanComplete",
      (event) => {
        // Handle the global event
        handleScanComplete(event);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const checkSetup = async () => {
    const avail = await ExpoRoomPlanModule.checkAvailability();
    setAvailability(avail);
    loadScans();
  };

  const loadScans = async () => {
    try {
      const files = await ExpoRoomPlanModule.getRoomScans();
      setScans(files);
    } catch (e) {
      console.error("Failed to load scans", e);
    }
  };

  const handleScanComplete = (event: ExpoRoomPlanScanResult) => {
    const { timestamp, error, usdzUri } = event;

    console.log("Scan complete at", timestamp);
    setScanning(false);

    if (error) {
      alert("Scan failed: " + error);
    } else {
      console.log("Saved at:", usdzUri);
      setIsProcessing(false);
      loadScans(); // Refresh list
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Delete All Scans",
      "Are you sure you want to delete all room scans? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ExpoRoomPlanModule.clearAllScans();
              setScans([]); // Clear the list in UI immediately
            } catch (e) {
              console.error("Failed to clear scans", e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Room Scanner</Text>
          <Text>
            Status: {availability?.isAvailable ? "Ready" : "Unavailable"}
          </Text>
        </View>
        {scans.length > 0 && (
          <Button title="Clear All" color="red" onPress={handleClearAll} />
        )}
      </View>

      {/* --- Scan List --- */}
      <FlatList
        data={scans}
        keyExtractor={(item) => item}
        style={styles.list}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No scans yet
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.scanItem}
            onPress={() => ExpoRoomPlanModule.previewScan(item)}
          >
            <Text style={styles.scanTitle}>📄 {item.split("/").pop()}</Text>
            <Text style={styles.scanPath} numberOfLines={1}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* --- New Scan Controls --- */}
      {availability?.isAvailable && (
        <View style={styles.controls}>
          <Button
            disabled={isProcessing}
            title={isProcessing ? "Processing..." : "Start New Scan"}
            onPress={() => setScanning(true)}
          />
          {isProcessing && <ActivityIndicator size="small" color="#0000ff" />}
        </View>
      )}

      {/* --- Scanner Modal --- */}
      <Modal
        visible={scanning}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <ExpoRoomPlanView
            style={{ flex: 1 }}
            scanName={scanName}
            onScanProcessing={() => setIsProcessing(true)}
          />

          {/* Overlay UI */}
          <View style={styles.overlay}>
            {isProcessing ? (
              <View style={styles.processingBadge}>
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Processing Room...
                </Text>
                <Text style={{ color: "#ddd", fontSize: 12 }}>Please wait</Text>
              </View>
            ) : (
              <Button
                title="Cancel"
                color="white"
                onPress={() => setScanning(false)}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  list: { flex: 1, padding: 15 },
  scanItem: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  scanTitle: { fontSize: 16, fontWeight: "600" },
  scanPath: { fontSize: 12, color: "#888", marginTop: 4 },
  controls: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#eee",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  overlay: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  processingBadge: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
});
