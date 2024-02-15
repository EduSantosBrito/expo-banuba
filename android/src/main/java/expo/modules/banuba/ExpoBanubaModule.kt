package expo.modules.banuba

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.banuba.sdk.cameraui.data.PipConfig
import com.banuba.sdk.core.license.BanubaVideoEditor
import com.banuba.sdk.core.license.LicenseStateCallback
import com.banuba.sdk.export.data.ExportResult
import com.banuba.sdk.export.utils.EXTRA_EXPORTED_SUCCESS
import com.banuba.sdk.ve.flow.VideoCreationActivity
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBanubaModule : Module() {

  private val mActivityEventListener: ActivityEventListener = ExportActivityEventListener()
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  companion object {
    const val TAG = "ExpoBanuba"

    private const val EXPORT_REQUEST_CODE = 1111
    private const val ERR_ACTIVITY_DOES_NOT_EXIST = "E_ACTIVITY_DOES_NOT_EXIST"
    private const val ERR_EXPORTED_VIDEO_NOT_FOUND = "E_EXPORTED_VIDEO_NOT_FOUND"
    private const val ERR_VIDEO_EDITOR_CANCELLED = "E_VIDEO_EDITOR_CANCELLED"
    private const val ERR_SDK_NOT_INITIALIZED_CODE = "ERR_VIDEO_EDITOR_NOT_INITIALIZED"
    private const val ERR_LICENSE_REVOKED_CODE = "ERR_VIDEO_EDITOR_LICENSE_REVOKED"
    private const val ERR_SDK_NOT_INITIALIZED_MESSAGE
            = "Banuba Video Editor SDK is not initialized: license token is unknown or incorrect.\nPlease check your license token or contact Banuba"
    private const val ERR_LICENSE_REVOKED_MESSAGE = "License is revoked or expired. Please contact Banuba https://www.banuba.com/faq/kb-tickets/new";
  }

  private var exportResultPromise: Promise? = null
  private var videoEditorSDK: BanubaVideoEditor? = null
  private var integrationModule: VideoEditorIntegrationModule? = null

  private fun checkVideoEditorLicense(
          licenseStateCallback: LicenseStateCallback,
          notInitializedError: () -> Unit
  ) {
    if (videoEditorSDK == null) {
      Log.e(
              TAG,
              "Cannot check license state. Please initialize Video Editor SDK"
      )
      notInitializedError()
    } else {
      // Checking the license might take around 1 sec in the worst case.
      // Please optimize use if this method in your application for the best user experience
      videoEditorSDK?.getLicenseState(licenseStateCallback)
    }
  }

  private inner class ExportActivityEventListener : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
      if (requestCode != EXPORT_REQUEST_CODE) {
        return
      }
      when (resultCode) {
        Activity.RESULT_OK -> {
          val exportResult = intent?.getParcelableExtra<ExportResult.Success>(
                  EXTRA_EXPORTED_SUCCESS
          )
          val exportedVideos = exportResult?.videoList ?: emptyList()
          val resultUri = exportedVideos.firstOrNull()?.sourceUri
          val previewUri = exportResult?.preview

          if (resultUri == null) {
            exportResultPromise?.reject(
                    ERR_EXPORTED_VIDEO_NOT_FOUND,
                    "Exported video is null", null
            )
          } else {
            exportResultPromise?.resolve(resultUri.toString())
          }
        }
        Activity.RESULT_CANCELED -> {
          exportResultPromise?.reject(
                  ERR_VIDEO_EDITOR_CANCELLED,
                  "Video editor export is cancelled or the user closed the sdk ", null
          )
        }
      }
      exportResultPromise = null
    }

    override fun onNewIntent(intent: Intent?) {}
  }

  private fun openVideoEditorInternal(inputPromise: Promise): Intent {
    this.exportResultPromise = inputPromise

    return VideoCreationActivity.startFromCamera(
            currentActivity,
            // set PiP video configuration
            PipConfig(
                    video = Uri.EMPTY,
                    openPipSettings = false
            ),
            // setup data that will be acceptable during export flow
            null,
            // set TrackData object if you open VideoCreationActivity with preselected music track
            null
    )
  }


  override fun definition() = ModuleDefinition {
    Name("ExpoBanuba")

    OnCreate {
      appContext
              .legacyModule<UIManager>()
              ?.registerActivityEventListener(mActivityEventListener)
    }

    OnDestroy {
      appContext
              .legacyModule<UIManager>()
              ?.unregisterActivityEventListener(mActivityEventListener)
    }
    
    AsyncFunction("initVideoEditor") { licenseToken: String, inputPromise: Promise ->
      videoEditorSDK = BanubaVideoEditor.initialize(licenseToken)
      if (videoEditorSDK == null) {
        // Token you provided is not correct - empty or truncated
        Log.e(TAG, ERR_SDK_NOT_INITIALIZED_MESSAGE)
        inputPromise.reject(ERR_SDK_NOT_INITIALIZED_CODE, ERR_SDK_NOT_INITIALIZED_MESSAGE, null)
      } else {
        if (integrationModule == null) {
          // Initialize video editor sdk dependencies
          integrationModule = VideoEditorIntegrationModule().apply {
            initialize(appContext.reactContext!!.applicationContext)
          }
        }
        inputPromise.resolve(null)
      }
    }

     AsyncFunction("openVideoEditor") { inputPromise: Promise ->
       checkVideoEditorLicense(
               licenseStateCallback = { isValid ->
                 if (isValid) {
                   // ✅ License is active, all good
                   // You can show button that opens Video Editor or
                   // Start Video Editor right away
                   val intent = openVideoEditorInternal(inputPromise)
                   currentActivity.startActivityForResult(intent, EXPORT_REQUEST_CODE)
                 } else {
                   // ❌ Use of Video Editor is restricted. License is revoked or expired.
                   inputPromise.reject(ERR_LICENSE_REVOKED_CODE, ERR_LICENSE_REVOKED_MESSAGE, null)
                 }
               },
               notInitializedError = {
                 inputPromise.reject(ERR_SDK_NOT_INITIALIZED_CODE, ERR_SDK_NOT_INITIALIZED_MESSAGE, null)
               }
       )
     }
  }
}
