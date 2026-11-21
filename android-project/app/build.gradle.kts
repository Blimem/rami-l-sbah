plugins { id("com.android.application") }
android {
    namespace = "com.limem.ramitounsi"
    compileSdk = 34
    defaultConfig { applicationId = "com.limem.ramitounsi"; minSdk = 24; targetSdk = 34; versionCode = 8; versionName = "2.6" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_1_8; targetCompatibility = JavaVersion.VERSION_1_8 }
}
