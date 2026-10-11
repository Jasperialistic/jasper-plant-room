package com.jasper.plantroom.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.jasper.plantroom.MainActivity
import com.jasper.plantroom.R
import com.jasper.plantroom.net.PlantRepository
import com.jasper.plantroom.ui.PlantRules
import kotlinx.coroutines.runBlocking

/**
 * Home-screen quick view (owner request: "quick view what is overdue and how
 * many plants i have"). Reads the shared Supabase collection read-only and
 * renders counts into a RemoteViews card — no new dependencies, no writes.
 */
class PlantRoomWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        val pendingResult = goAsync()
        Thread {
            val views = try {
                PlantRepository.initialize(context)
                val plants = runBlocking { PlantRepository.loadPlants() }
                val total = plants.size
                val overdue = plants.count { PlantRules.statusOf(it) == "overdue" }
                val today = plants.count { PlantRules.statusOf(it) == "today" }
                val reservoir = plants.count { PlantRules.statusOf(it) == "reservoir" }
                RemoteViews(context.packageName, R.layout.widget_quick_view).apply {
                    setTextViewText(R.id.widgetCounts, "$total plants profiled")
                    setTextViewText(
                        R.id.widgetDue,
                        "Overdue $overdue · Check today $today · Reservoir $reservoir",
                    )
                    setOnClickPendingIntent(R.id.widgetRoot, launchApp(context))
                }
            } catch (error: Exception) {
                RemoteViews(context.packageName, R.layout.widget_quick_view).apply {
                    setTextViewText(R.id.widgetCounts, "Guren's Garden")
                    setTextViewText(R.id.widgetDue, "Tap to open")
                    setOnClickPendingIntent(R.id.widgetRoot, launchApp(context))
                }
            }
            appWidgetIds.forEach { appWidgetManager.updateAppWidget(it, views) }
            pendingResult.finish()
        }.start()
    }

    private fun launchApp(context: Context): PendingIntent =
        PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
}
