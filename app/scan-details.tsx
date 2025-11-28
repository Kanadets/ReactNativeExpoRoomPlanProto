import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExpoRoomPlanModule from "@/modules/ExpoRoomPlan";

export default function ScanDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scanPath } = useLocalSearchParams<{ scanPath: string }>();
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scanPath) {
      loadJsonData();
    }
  }, [scanPath]);

  const loadJsonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const json = await ExpoRoomPlanModule.readScanJson(scanPath);
      if (json) {
        // Try to format the JSON for better readability
        try {
          const parsed = JSON.parse(json);
          setJsonData(JSON.stringify(parsed, null, 2));
        } catch {
          setJsonData(json);
        }
      } else {
        setError("Failed to load JSON data");
      }
    } catch (e) {
      setError(`Error loading JSON: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const fileName = scanPath?.split("/").pop() || "Unknown";

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{fileName}</Text>
        <Text style={styles.filePath} numberOfLines={1}>
          {scanPath}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading JSON data...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadJsonData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : jsonData ? (
          <View style={styles.jsonContainer}>
            <Text style={styles.jsonText} selectable>
              {jsonData}
            </Text>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>No data available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 60,
  },
  fileInfo: {
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  filePath: {
    fontSize: 12,
    color: "#888",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorText: {
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  jsonContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },
});
