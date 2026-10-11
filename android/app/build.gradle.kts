plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.jasper.plantroom"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.jasper.plantroom"
        minSdk = 28
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"

        // Public client credentials (RLS-protected; identical to the shipped web app).
        buildConfigField("String", "SUPABASE_URL", "\"https://vslyrabiqgbgbcqgooxb.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"sb_publishable_XIV1eL17oFSgt5P5WzGiyw_ITPtSRbS\"")
        buildConfigField("String", "MEDIA_BUCKET", "\"plant-media\"")
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
        }
        release {
            isMinifyEnabled = false
            // Release signing identity is owner-gated; DEV APKs use the debug signer.
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging {
        resources.excludes += setOf("/META-INF/{AL2.0,LGPL2.1}")
    }
}

dependencies {
    // Align Kotlin stdlib with the toolchain's 2.2.x compiler (supabase/ktor pin 2.3.21);
    // newer stdlib artifacts carry metadata the pinned compiler cannot read.
    configurations.all {
        resolutionStrategy {
            force("org.jetbrains.kotlin:kotlin-stdlib:2.3.21")
            force("org.jetbrains.kotlin:kotlin-stdlib-jdk7:2.3.21")
            force("org.jetbrains.kotlin:kotlin-stdlib-jdk8:2.3.21")
        }
    }
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")
    val composeBom = platform("androidx.compose:compose-bom:2026.09.00")
    implementation(composeBom)

    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.11.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.11.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material3.adaptive:adaptive")

    implementation("io.github.jan-tennert.supabase:auth-kt:3.6.0")
    implementation("io.github.jan-tennert.supabase:postgrest-kt:3.6.0")
    implementation("io.github.jan-tennert.supabase:storage-kt:3.6.0")
    implementation("io.ktor:ktor-client-okhttp:3.4.3")
    implementation("io.coil-kt.coil3:coil-compose:3.6.3")

    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
}
