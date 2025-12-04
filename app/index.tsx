import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  console.log("ExpoRoomPlanModule");

  const [availability, setAvailability] =
    useState<ExpoRoomPlanAvailability | null>(null);
  const [scans, setScans] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanName, setScanName] = useState("My Room");
  const [uploading, setUploading] = useState(false);

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

  const handleUploadScan = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Accept all files, it'll be filtered by extension
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        Alert.alert("Error", "Failed to get file URI");
        setUploading(false);
        return;
      }

      // Check if file has .usdz extension
      const fileName = file.name || "";
      if (!fileName.toLowerCase().endsWith(".usdz")) {
        Alert.alert(
          "Invalid File",
          "Please select a USDZ file (.usdz extension)"
        );
        setUploading(false);
        return;
      }

      // Import the file to the app's document directory
      const importedPath = await ExpoRoomPlanModule.importScan(file.uri);

      if (importedPath) {
        Alert.alert("Success", "Room plan uploaded successfully!");
        loadScans(); // Refresh the list
      } else {
        Alert.alert("Error", "Failed to import room plan");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", `Failed to upload: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
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
        renderItem={({ item }) => {
          console.log("item", item);
          return (
            <TouchableOpacity
              style={styles.scanItem}
              onPress={() =>
                router.push(
                  `/scan-details?scanPath=${encodeURIComponent(item)}`
                )
              }
              onLongPress={() => ExpoRoomPlanModule.previewScan(item)}
            >
              <Text style={styles.scanTitle}>📄 {item.split("/").pop()}</Text>
              <Text style={styles.scanPath} numberOfLines={1}>
                {item}
              </Text>
              <Text style={styles.hintText}>
                Tap to view details • Long press to preview
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* --- New Scan Controls --- */}
      <View style={styles.controls}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button
              disabled={uploading || isProcessing}
              title={uploading ? "Uploading..." : "📤 Upload USDZ"}
              onPress={handleUploadScan}
              color="#34C759"
            />
          </View>
          {availability?.isAvailable && (
            <View style={styles.buttonContainer}>
              <Button
                disabled={isProcessing || uploading}
                title={isProcessing ? "Processing..." : "Start New Scan"}
                onPress={() => setScanning(true)}
              />
            </View>
          )}
        </View>
        {(isProcessing || uploading) && (
          <ActivityIndicator
            size="small"
            color="#0000ff"
            style={styles.loader}
          />
        )}
      </View>

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
  hintText: { fontSize: 10, color: "#aaa", marginTop: 4, fontStyle: "italic" },
  controls: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flex: 1,
    minWidth: 120,
  },
  loader: {
    marginTop: 10,
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
