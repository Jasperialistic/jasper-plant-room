package com.jasper.plantroom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil3.compose.AsyncImage

data class PhotoSlide(val url: String, val caption: String)

/**
 * Facebook-style full-screen photo viewer: swipe between photos, pinch to
 * zoom, drag to pan, caption + counter chrome, tap X or system Back to close.
 */
@Composable
fun PhotoViewer(slides: List<PhotoSlide>, startIndex: Int, title: String = "", onDismiss: () -> Unit) {
    if (slides.isEmpty()) return
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false,
            dismissOnClickOutside = false,
            dismissOnBackPress = true,
        ),
    ) {
        androidx.activity.compose.BackHandler(onBack = onDismiss)
        val pagerState = rememberPagerState(initialPage = startIndex.coerceIn(0, slides.lastIndex)) { slides.size }
        var actionUrl by remember { mutableStateOf<String?>(null) }

        Box(
            Modifier
                .fillMaxSize()
                .background(Color(0xF2000000))
        ) {
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize(),
            ) { page ->
                ZoomableImage(slides[page].url) { actionUrl = slides[page].url }
            }

            // long-press menu: Copy / Save / Share (original bytes, Supabase untouched)
            actionUrl?.let { url ->
                ImageActionSheet(url = url, onDismiss = { actionUrl = null })
            }

            // top chrome: counter + close
            Row(
                Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .padding(horizontal = 16.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    if (title.isNotBlank()) {
                        Text(title, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                    }
                    Text(
                        "${pagerState.currentPage + 1} / ${slides.size}",
                        color = Color(0xB3FFFFFF), fontSize = 12.sp,
                    )
                }
                Spacer(Modifier.weight(1f))
                Box(
                    Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color(0x33FFFFFF))
                        .clickable(onClick = onDismiss)
                        .padding(horizontal = 14.dp, vertical = 7.dp)
                ) {
                    Text("✕", color = Color.White, fontSize = 15.sp)
                }
            }

            // caption
            val caption = slides[pagerState.currentPage].caption
            if (caption.isNotBlank()) {
                Column(
                    Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(horizontal = 20.dp, vertical = 26.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(caption, color = Color(0xCCFFFFFF), fontSize = 13.sp, textAlign = TextAlign.Center)
                }
            }
        }
    }
}

@Composable
private fun ZoomableImage(url: String, onImageLongPress: () -> Unit = {}) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    Box(
        Modifier
            .fillMaxSize()
            // Double-tap zooms; at scale 1 no transform detector runs, so the
            // pager receives swipes (the previous always-on detector consumed them).
            .pointerInput(url) {
                detectTapGestures(
                    onDoubleTap = {
                        scale = if (scale > 1f) 1f else 2.5f
                        if (scale <= 1f) { offsetX = 0f; offsetY = 0f }
                    },
                    onLongPress = { onImageLongPress() },
                )
            }
            .pointerInput(url, scale) {
                if (scale > 1f) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        scale = (scale * zoom).coerceIn(1f, 6f)
                        if (scale <= 1f) {
                            offsetX = 0f; offsetY = 0f
                        } else {
                            offsetX += pan.x; offsetY += pan.y
                        }
                    }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        AsyncImage(
            model = url,
            contentDescription = null,
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    translationX = offsetX
                    translationY = offsetY
                },
        )
    }
}
