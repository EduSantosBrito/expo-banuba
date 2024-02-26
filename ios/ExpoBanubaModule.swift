import ExpoModulesCore
import BanubaVideoEditorSDK
import VideoEditor
import VEExportSDK
import BanubaUtilities
import Foundation
import UIKit
import Photos
import BSImagePicker
import BanubaLicenseServicingSDK

typealias TimerOptionConfiguration = TimerConfiguration.TimerOptionConfiguration

public class ExpoBanubaModule: Module {
    var delegate = ExpoBanubaDelegate()
    public func definition() -> ModuleDefinition {
        Name("ExpoBanuba")
        
        AsyncFunction("initVideoEditor") { (token: String, promise: Promise) in
            delegate.openVideoEditorDefault(self, token, promise)
        }.runOnQueue(.main)
        
        AsyncFunction("openVideoEditor") { (promise: Promise) in
        }.runOnQueue(.main)
        
        View(ExpoBanubaDelegate.self){
        }
    }
}

class ExpoBanubaDelegate: ExpoView, BanubaVideoEditorDelegate {
  // MARK: - VideoEditorSDK
  private var videoEditorModule: VideoEditorModule?
  
  // Use “true” if you want users could restore the last video editing session.
  private let restoreLastVideoEditingSession: Bool = false
  private var inputPromise: Promise? = nil

  // MARK: - Handle BanubaVideoEditor callbacks
  func videoEditorDidCancel(_ videoEditor: BanubaVideoEditor) {
    if restoreLastVideoEditingSession == false {
      videoEditor.clearSessionData()
    }
    videoEditor.dismissVideoEditor(animated: true, completion: nil)
  }
  
  func videoEditorDone(_ videoEditor: BanubaVideoEditor) {
    videoEditor.dismissVideoEditor(animated: true) { [weak self] in
        self?.exportVideo(videoEditor: videoEditor, self?.inputPromise)
    }
  }

  func openVideoEditorDefault(_ sender: Any, _ token: String, _ promise: Promise) {
      let musicTrackPreset: MediaTrack? = nil
      self.inputPromise = promise
      // Uncomment to apply custom audio track in video editor
      //let musicTrackPreset = prepareMusicTrack(audioFileName: "short_music_20.wav")
      
      guard let viewController = RCTPresentedViewController() else {
          print("Error when trying to get the viewController");
          return;
      }
      
      let launchConfig = VideoEditorLaunchConfig(
        entryPoint: .camera,
        hostController: viewController,
        musicTrack: musicTrackPreset, // Paste a music track as a track preset at the camera screen to record video with music
        animated: true
      )
      checkLicenseAndOpenVideoEditor(with: launchConfig, token, promise)
  }
  
  private func checkLicenseAndOpenVideoEditor(with launchConfig: VideoEditorLaunchConfig, _ token: String, _ promise: Promise) {
    // Deallocate any active instances of both editors to free used resources
    // and to prevent "You are trying to create the second instance of the singleton." crash
    videoEditorModule = nil
    
    videoEditorModule = VideoEditorModule(token: token)
    
    guard let videoEditorSDK = videoEditorModule?.videoEditorSDK else {
      return
    }

    videoEditorSDK.delegate = self
    videoEditorSDK.getLicenseState(completion: { [weak self] isValid in
      if isValid {
        print("✅ License is active, all good")
        self?.videoEditorModule?.presentVideoEditor(with: launchConfig)
      } else {
        print("❌ License is either revoked or expired")
      }
    })
  }

}

// MARK: - Export example
extension ExpoBanubaDelegate {
  func exportVideo(videoEditor: BanubaVideoEditor, _ inputPromise: Promise?) {
    guard let videoEditorModule else { return }
    let progressViewController = videoEditorModule.createProgressViewController()
    progressViewController.cancelHandler = { videoEditor.stopExport() }
    guard let viewController = RCTPresentedViewController() else {
      print("Error when trying to get the viewController");
      return;
    }
    viewController.present(progressViewController, animated: true)
    
    let manager = FileManager.default
    let exportedVideoFileName = "tmp.mov"
    let videoURL = manager.temporaryDirectory.appendingPathComponent(exportedVideoFileName)
    if manager.fileExists(atPath: videoURL.path) {
      try? manager.removeItem(at: videoURL)
    }
    
    let exportConfiguration = videoEditorModule.createExportConfiguration(destFile: videoURL)
    
    videoEditor.export(
      using: exportConfiguration,
      exportProgress: { [weak progressViewController] progress in
        DispatchQueue.main.async {
          progressViewController?.updateProgressView(with: Float(progress))
        }
      },
      completion: { [weak self, weak progressViewController] error, exportCoverImages in
        DispatchQueue.main.async {
          // Hide progress view
          progressViewController?.dismiss(animated: true) {
            // Clear video editor session data
            if self?.restoreLastVideoEditingSession == false {
              videoEditor.clearSessionData()
            }
            if error == nil {
              self?.inputPromise?.resolve(videoURL.path)
            }
          }
        }
    })
  }
  
}
