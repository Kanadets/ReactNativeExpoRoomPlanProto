import ExpoModulesCore
import QuickLook

public class ExpoRoomPlanModule: Module {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    public func definition() -> ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoRoomPlan')` in JavaScript.
        Name("ExpoRoomPlan")
        
        Events("onScanComplete")
        
        AsyncFunction(
            "checkAvailability",
            { () -> ExpoRoomPlanAvailability in
                return await getExpoRoomPlanAvailability()
            }
        )
        
        AsyncFunction("getRoomScans") { () -> [String] in
            let docPath = FileManager.default.urls(
                for: .documentDirectory,
                in: .userDomainMask
            ).first!

            do {
                // Get contents including properties for Creation Date
                let fileURLs = try FileManager.default.contentsOfDirectory(
                    at: docPath,
                    includingPropertiesForKeys: [.creationDateKey]
                )

                // Filter for USDZ and Sort by Date (Newest First)
                let sortedUSDZFiles = fileURLs
                    .filter { $0.pathExtension == "usdz" }
                    .sorted { url1, url2 in
                        let date1 = (try? url1.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
                        let date2 = (try? url2.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
                        return date1 > date2
                    }

                return sortedUSDZFiles.map { $0.path }
            } catch {
                // If reading the directory fails, return an empty list instead of an optional
                return []
            }
        }
        
        AsyncFunction("previewScan") { (path: String) in
            let url = URL(fileURLWithPath: path)

            DispatchQueue.main.async {
                let previewController = QLPreviewController()
                let dataSource = PreviewDataSource(url: url)
                previewController.dataSource = dataSource

                if let currentVC = self.appContext?.utilities?
                    .currentViewController()
                {
                    currentVC.present(previewController, animated: true)
                }
            }
        }
        
        AsyncFunction("clearAllScans") { () -> Void in
            let fileManager = FileManager.default
            let docPath = fileManager.urls(
                for: .documentDirectory,
                in: .userDomainMask
            ).first!

            // Get all files in the directory
            let fileURLs = try fileManager.contentsOfDirectory(
                at: docPath,
                includingPropertiesForKeys: nil
            )

            // Iterate and delete specific file types
            for url in fileURLs {
                if url.pathExtension == "usdz" || url.pathExtension == "json" {
                    try fileManager.removeItem(at: url)
                }
            }
        }

        View(ExpoRoomPlanView.self) {
            Events("onScanProcessing")

            Prop("scanName") { (view: ExpoRoomPlanView, name: String) in
                view.scanName = name
            }
        }
    }
}

// MARK: - Check if device supports RoomPlanAPI
private func getExpoRoomPlanAvailability() async -> ExpoRoomPlanAvailability {
    let availability = ExpoRoomPlanAvailability()

    if #available(iOS 17, *) {
        availability.isAvailable = true
        availability.deviceSupported = true
    } else {
        availability.availabilityReason =
            "Device doesn't support RoomPlan API. Make sure that your device run iOS version 17 or older."
    }

    return availability
}

//MARK: - For file viewing
// Helper for QuickLook
class PreviewDataSource: NSObject, QLPreviewControllerDataSource {
    let url: URL
    init(url: URL) { self.url = url }

    func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
        return 1
    }

    func previewController(
        _ controller: QLPreviewController,
        previewItemAt index: Int
    ) -> QLPreviewItem { return url as QLPreviewItem }
}

