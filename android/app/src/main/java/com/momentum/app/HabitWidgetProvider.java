package com.momentum.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class HabitWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Read progress statistics from CapacitorPreferences SharedPreferences file
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        
        String completedStr = prefs.getString("widget_habits_completed", "0");
        String totalStr = prefs.getString("widget_habits_total", "0");
        
        int completed = 0;
        int total = 0;
        try {
            completed = Integer.parseInt(completedStr);
            total = Integer.parseInt(totalStr);
        } catch (NumberFormatException e) {
            // Fallback
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.habit_widget);

        // Update progress bar and text views
        if (total > 0) {
            int progressPercent = (completed * 100) / total;
            views.setTextViewText(R.id.widget_habit_text, "Habits: " + completed + "/" + total + " completed");
            views.setProgressBar(R.id.widget_progress_bar, 100, progressPercent, false);
            
            if (completed == total) {
                views.setTextViewText(R.id.widget_date_text, "All habits checked! Keep it up! ✨");
            } else {
                views.setTextViewText(R.id.widget_date_text, "Track your growth. Tap to log.");
            }
        } else {
            views.setTextViewText(R.id.widget_habit_text, "No habits logged today");
            views.setProgressBar(R.id.widget_progress_bar, 100, 0, false);
            views.setTextViewText(R.id.widget_date_text, "Tap to open Momentum & add habits.");
        }

        // Create an intent to launch MainActivity when clicking the widget root
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
