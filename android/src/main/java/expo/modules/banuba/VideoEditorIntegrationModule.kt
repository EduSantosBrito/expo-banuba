package expo.modules.banuba

import android.content.Context
import android.net.Uri
import androidx.core.net.toFile
import androidx.fragment.app.Fragment
import com.banuba.sdk.arcloud.data.source.ArEffectsRepositoryProvider
import com.banuba.sdk.arcloud.di.ArCloudKoinModule
import com.banuba.sdk.audiobrowser.di.AudioBrowserKoinModule
import com.banuba.sdk.audiobrowser.domain.AudioBrowserMusicProvider
import com.banuba.sdk.core.AspectRatio
import com.banuba.sdk.core.HardwareClassProvider
import com.banuba.sdk.core.VideoResolution
import com.banuba.sdk.core.data.TrackData
import com.banuba.sdk.core.domain.AspectRatioProvider
import com.banuba.sdk.core.ext.toPx
import com.banuba.sdk.core.media.MediaFileNameHelper
import com.banuba.sdk.core.ui.ContentFeatureProvider
import com.banuba.sdk.effectplayer.adapter.BanubaEffectPlayerKoinModule
import com.banuba.sdk.export.data.ExportParams
import com.banuba.sdk.export.data.ExportParamsProvider
import com.banuba.sdk.export.di.VeExportKoinModule
import com.banuba.sdk.gallery.di.GalleryKoinModule
import com.banuba.sdk.playback.di.VePlaybackSdkKoinModule
import com.banuba.sdk.ve.di.VeSdkKoinModule
import com.banuba.sdk.ve.domain.VideoRangeList
import com.banuba.sdk.ve.effects.Effects
import com.banuba.sdk.ve.effects.music.MusicEffect
import com.banuba.sdk.ve.effects.watermark.WatermarkAlignment
import com.banuba.sdk.ve.effects.watermark.WatermarkBuilder
import com.banuba.sdk.ve.ext.withWatermark
import com.banuba.sdk.ve.flow.di.VeFlowKoinModule
import com.banuba.sdk.veui.di.VeUiSdkKoinModule
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin
import org.koin.core.qualifier.named
import org.koin.dsl.module

class VideoEditorIntegrationModule {

    fun initialize(applicationContext: Context) {
        startKoin {
            androidContext(applicationContext)
            allowOverride(true)

            // pass the customized Koin module that implements required dependencies. Keep order of modules
            modules(
                    VeSdkKoinModule().module,
                    VeExportKoinModule().module,
                    VePlaybackSdkKoinModule().module,
                    AudioBrowserKoinModule().module, // use this module only if you bought it
                    ArCloudKoinModule().module,
                    VeUiSdkKoinModule().module,
                    VeFlowKoinModule().module,
                    GalleryKoinModule().module,
                    BanubaEffectPlayerKoinModule().module,
                    SampleIntegrationKoinModule().module,
            )
        }
    }
}

/**
 * All dependencies mentioned in this module will override default
 * implementations provided from SDK.
 * Some dependencies has no default implementations. It means that
 * these classes fully depends on your requirements
 */
private class SampleIntegrationKoinModule {

    val module = module {
        /**
         * Provides params for export
         * */
        factory<ExportParamsProvider> {
            val hardwareClass = get<HardwareClassProvider>().provideHardwareClass()

            CustomExportParamsProvider(
                    exportDir = get(named("exportDir")),
                    videoResolution = hardwareClass.optimalResolution,
                    watermarkBuilder = get()
            )
        }

        single<ArEffectsRepositoryProvider>(createdAtStart = true) {
            ArEffectsRepositoryProvider(
                    arEffectsRepository = get(named("backendArEffectsRepository")),
                    ioDispatcher = get(named("ioDispatcher"))
            )
        }

        single<ContentFeatureProvider<TrackData, Fragment>>(
                named("musicTrackProvider")
        ) {
            AudioBrowserMusicProvider()
        }

        single<AspectRatioProvider> {
            object : AspectRatioProvider {
                override fun provide(): AspectRatio = AspectRatio(9.0 / 16)
            }
        }
    }
}

private class CustomExportParamsProvider(
        private val exportDir: Uri,
        private val videoResolution: VideoResolution,
        private val watermarkBuilder: WatermarkBuilder
) : ExportParamsProvider {

    override fun provideExportParams(
            effects: Effects,
            videoRangeList: VideoRangeList,
            musicEffects: List<MusicEffect>,
            videoVolume: Float
    ): List<ExportParams> {
        val exportSessionDir = exportDir.toFile().apply {
            deleteRecursively()
            mkdirs()
        }

        // Change values if you need multiple exported video files
        val requireExportExtraSound = false
        val requireExportWatermark = false


        val exportDefault = ExportParams.Builder(videoResolution)
                .effects(effects)
                .fileName("export_default")
                .videoRangeList(videoRangeList)
                .destDir(exportSessionDir)
                .musicEffects(musicEffects)
                .volumeVideo(videoVolume)
                .build()

        val listVideoToExport = mutableListOf<ExportParams>()
        listVideoToExport.add(exportDefault)


        if (requireExportExtraSound) {
            val extraSoundtrackUri = Uri.parse(exportSessionDir.toString()).buildUpon()
                    .appendPath("exported_soundtrack.${MediaFileNameHelper.DEFAULT_SOUND_FORMAT}")
                    .build()
            listVideoToExport.add(
                    ExportParams.Builder(videoResolution)
                            .fileName("export_extra_sound")
                            .videoRangeList(videoRangeList)
                            .destDir(exportSessionDir)
                            .musicEffects(musicEffects)
                            .extraAudioFile(extraSoundtrackUri)
                            .volumeVideo(videoVolume)
                            .build()
            )
        }

        if (requireExportWatermark) {
            listVideoToExport.add(
                    ExportParams.Builder(VideoResolution.Exact.VGA360)
                            .effects(effects.withWatermark(watermarkBuilder, WatermarkAlignment.BottomRight(marginRightPx = 16.toPx)))
                            .fileName("export_360_watermark")
                            .videoRangeList(videoRangeList)
                            .destDir(exportSessionDir)
                            .musicEffects(musicEffects)
                            .volumeVideo(videoVolume)
                            .build()
            )
        }

        return listVideoToExport
    }
}