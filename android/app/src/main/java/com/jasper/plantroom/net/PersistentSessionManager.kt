package com.jasper.plantroom.net

import android.content.Context
import android.content.SharedPreferences
import io.github.jan.supabase.auth.SessionManager
import io.github.jan.supabase.auth.user.UserSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json

/**
 * Keeps the owner signed in across app restarts (the private-app experience):
 * the Supabase session is persisted in the app's private storage and restored
 * on launch, with token refresh handled by the Auth module. No credentials are
 * ever embedded in source or the APK — the session is created by the owner's
 * own sign-in and can be cleared with the in-app sign-out.
 */
class PersistentSessionManager(context: Context) : SessionManager {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("plantroom_session", Context.MODE_PRIVATE)

    override suspend fun saveSession(session: UserSession) {
        withContext(Dispatchers.IO) {
            prefs.edit().putString(KEY, Json.encodeToString(UserSession.serializer(), session)).apply()
        }
    }

    override suspend fun loadSession(): UserSession =
        loadSessionOrNull() ?: error("No saved session")

    override suspend fun deleteSession() {
        withContext(Dispatchers.IO) { prefs.edit().remove(KEY).apply() }
    }

    override suspend fun loadSessionOrNull(): UserSession? = withContext(Dispatchers.IO) {
        prefs.getString(KEY, null)?.let { raw ->
            runCatching { Json.decodeFromString(UserSession.serializer(), raw) }.getOrNull()
        }
    }

    private companion object {
        const val KEY = "session_json"
    }
}
