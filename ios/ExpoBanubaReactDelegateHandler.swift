import ExpoModulesCore
import BanubaVideoEditorSDK

public class ExpoBanubaReactDelegateHandler: ExpoReactDelegateHandler, MusicEditorExternalViewControllerFactory {
    var audioBrowserModule: AudioBrowserModule?
    
    public func closeAudioBrowser () {
        audioBrowserModule?.onClose()
    }
    
    public func selectAudio(selectedAudio: SelectedAudio) {
        audioBrowserModule?.selectAudio(selectedAudio: selectedAudio)
    }

    // Audio Browser selection view controller
    public func makeTrackSelectionViewController(selectedAudioItem: AudioItem?) -> TrackSelectionViewController? {
      let module = AudioBrowserModule(nibName: nil, bundle: nil)

      audioBrowserModule = module
      return module
    }

    // Effects selection view controller. Used at Music editor screen
    public func makeEffectSelectionViewController(selectedAudioItem: BanubaUtilities.AudioItem?) -> BanubaUtilities.EffectSelectionViewController? {
      return nil
    }

    // Returns recorder countdown view for voice recorder screen
    public func makeRecorderCountdownAnimatableView() -> BanubaVideoEditorSDK.MusicEditorCountdownAnimatableView? {
      return nil
    }
}
