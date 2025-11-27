import ExpoModulesCore
import RoomPlan
import UIKit

class ExpoRoomPlanView: ExpoView {
    let onScanProcessing = EventDispatcher()
    var scanName: String = "Untitled"
    private var roomCaptureView: UIView?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        if #available(iOS 17.0, *) {
            let view = RoomCaptureView()
            view.delegate = self
            self.roomCaptureView = view
            addSubview(view)
            print("SWIFT: RoomCaptureView initialized and delegate set")
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        roomCaptureView?.frame = bounds
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()

        if #available(iOS 17.0, *) {
            guard let captureView = roomCaptureView as? RoomCaptureView else {
                return
            }

            if self.window != nil {
                // View is mounted -> Start Session
                var config = RoomCaptureSession.Configuration()
                captureView.captureSession.run(configuration: config)
                print("SWIFT: Session Started")
            } else {
                // View is unmounted -> Stop Session
                captureView.captureSession.stop()
                print("SWIFT: Session Stopped (View removed)")
            }
        }
    }
}

// MARK: - Delegate Implementation
@available(iOS 17.0, *)
extension ExpoRoomPlanView: RoomCaptureViewDelegate {
    func captureView(
        shouldPresent roomDataForProcessing: CapturedRoomData,
        error: Error?
    ) -> Bool {
        if let error = error {
            print(
                "SWIFT: Scan failed with error: \(error.localizedDescription)"
            )

            return false
        }

        print("SWIFT: Start processing")
        onScanProcessing([:])

        Task {
            do {
                let builder = RoomBuilder(options: [.beautifyObjects])
                let finalRoom = try await builder.capturedRoom(
                    from: roomDataForProcessing
                )

                // Prepare Paths
                let documentsPath = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask
                ).first!
                let fileName = finalRoom.identifier.uuidString
                let usdzURL = documentsPath.appendingPathComponent(
                    "\(fileName).usdz"
                )
                let jsonURL = documentsPath.appendingPathComponent(
                    "\(fileName).json"
                )

                // Export USDZ (3D Model)
                try finalRoom.export(to: usdzURL)

                // Export JSON (Data)
                let jsonData = try JSONEncoder().encode(finalRoom)
                try jsonData.write(to: jsonURL)

                print("SWIFT: File operations done. preparing dispatch...")

                let payload: [String: Any] = [
                    "uuid": finalRoom.identifier.uuidString,
                    "usdzUri": usdzURL.path,
                    "jsonUri": jsonURL.path,
                    "timestamp": Date().timeIntervalSince1970 * 1000,
                    "error": "",
                ]

                print("SWIFT: Scan finished. Broadcasting global event...")

                DispatchQueue.main.async {
                    self.appContext?.eventEmitter?.sendEvent(
                        withName: "onScanComplete",
                        body: payload
                    )
                }

            } catch {
                // Send error globally too
                DispatchQueue.main.async {
                    self.appContext?.eventEmitter?.sendEvent(
                        withName: "onScanComplete",
                        body: ["error": error.localizedDescription]
                    )
                }
            }
        }

        return false
    }
}
