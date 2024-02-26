require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoBanuba'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '14.0'
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/EduSantosBrito/expo-banuba' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.dependency 'BanubaARCloudSDK', '1.33.3'
  s.dependency 'BanubaVideoEditorSDK', '1.33.3'
  s.dependency 'BanubaAudioBrowserSDK', '1.33.3'
  s.dependency 'BanubaSDKSimple', '1.33.3'
  s.dependency 'BanubaSDKServicing', '1.33.3'
  s.dependency 'VideoEditor', '1.33.3'
  s.dependency 'BanubaUtilities', '1.33.3'
  s.dependency 'BanubaVideoEditorGallerySDK', '1.33.3'
  s.dependency 'BanubaLicenseServicingSDK', '1.33.3'
  s.dependency 'BNBLicenseUtils', '1.33.3'
  s.dependency 'VEExportSDK', '1.33.3'
  s.dependency 'VEEffectsSDK', '1.33.3'
  s.dependency 'VEPlaybackSDK', '1.33.3'
  s.dependency "BSImagePicker"

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
