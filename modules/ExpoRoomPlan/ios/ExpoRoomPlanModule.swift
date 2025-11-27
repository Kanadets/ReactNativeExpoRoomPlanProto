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
            // Get all files, filter for .usdz, and return their full paths
            let files = try FileManager.default.contentsOfDirectory(
                at: docPath,
                includingPropertiesForKeys: nil
            )

            return files.filter { $0.pathExtension == "usdz" }.map { $0.path }
        }

        AsyncFunction("previewScan") { (path: String) in
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
