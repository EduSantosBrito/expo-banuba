
import UIKit
import BanubaVideoEditorSDK

import VideoEditor
import Photos
import BSImagePicker
import VEExportSDK
import ExpoModulesCore

// Adopting CountdownView to using in BanubaVideoEditorSDK
extension CountdownView: MusicEditorCountdownAnimatableView {}

class VideoEditorModule {

    var videoEditorSDK: BanubaVideoEditor?
    var viewControllerFactory = ViewControllerFactory()
    
    var isVideoEditorInitialized: Bool { videoEditorSDK != nil }
    
    init(token: String) {
        let config = createConfiguration()
        
        let videoEditorSDK = BanubaVideoEditor(
            token: token,
            configuration: config,
            externalViewControllerFactory: viewControllerFactory
        )
        
        self.videoEditorSDK = videoEditorSDK
    }
    
    func presentVideoEditor(with launchConfig: VideoEditorLaunchConfig) {
        guard isVideoEditorInitialized else {
            print("BanubaVideoEditor is not initialized!")
            return
        }
        videoEditorSDK?.presentVideoEditor(
            withLaunchConfiguration: launchConfig,
            completion: nil
        )
    }
    
    func createExportConfiguration(destFile: URL) -> ExportConfiguration {
        let exportConfiguration = ExportVideoConfiguration(
          fileURL: destFile,
          quality: .auto,
          useHEVCCodecIfPossible: true,
          watermarkConfiguration: nil
        )
        
        let exportConfig = ExportConfiguration(
          videoConfigurations: [exportConfiguration],
          isCoverEnabled: true,
          gifSettings: GifSettings(duration: 0.3)
        )
        
        return exportConfig
    }
    
    func createProgressViewController() -> ProgressViewController {
      let progressViewController = ProgressViewController.makeViewController()
      progressViewController.message = "Exporting"
      return progressViewController
    }
    
    func createConfiguration() -> VideoEditorConfig {
        var config = VideoEditorConfig()
        
        config.setupColorsPalette(
            VideoEditorColorsPalette(
                primaryColor: .white,
                secondaryColor: .black,
                accentColor: .white,
                effectButtonColorsPalette: EffectButtonColorsPalette(
                    defaultIconColor: .white,
                    defaultBackgroundColor: .clear,
                    selectedIconColor: .black,
                    selectedBackgroundColor: .white
                ),
                addGalleryItemBackgroundColor: .white,
                addGalleryItemIconColor: .black,
                timelineEffectColorsPalette: TimelineEffectColorsPalette.default
            )
        )
        
        var featureConfiguration = config.featureConfiguration
        featureConfiguration.supportsTrimRecordedVideo = true
        featureConfiguration.isMuteCameraAudioEnabled = true
        config.updateFeatureConfiguration(featureConfiguration: featureConfiguration)
        
        return config
    }
}

class AudioBrowserModule: UIViewController, TrackSelectionViewController, RCTBridgeModule {
  weak var trackSelectionDelegate: TrackSelectionViewControllerDelegate?
    
  static func moduleName() -> String! {
    return "expo_banuba_audio_browser"
  }

  static func requiresMainQueueSetup() -> Bool {
    return true
  }
    
  func onClose() {
    trackSelectionDelegate?.trackSelectionViewControllerDidCancel(viewController: self)
  }

  override func viewDidLoad() {
      let bridge = RCTBridge.current()
      self.view = RCTRootView(
        bridge: bridge!,
        moduleName: AudioBrowserModule.moduleName(),
        initialProperties: nil
      )
  }
}

class ViewControllerFactory: ExternalViewControllerFactory {

  // Override to use custom audio browser experience. Set nil to use default implementation
  var musicEditorFactory: MusicEditorExternalViewControllerFactory? = ExpoBanubaReactDelegateHandler()

  var countdownTimerViewFactory: CountdownTimerViewFactory?

  var exposureViewFactory: AnimatableViewFactory?
}
