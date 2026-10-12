package com.jasper.plantroom.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.jasper.plantroom.net.HttpImageBytesSource
import com.jasper.plantroom.net.ImageAction
import com.jasper.plantroom.net.ImageActionCoordinator
import com.jasper.plantroom.net.ImageActionResult
import com.jasper.plantroom.ui.theme.NoirColors
import kotlinx.coroutines.launch

/**
 * Long-press menu over the enlarged photo: Copy image, Save to Gallery,
 * Share image. Downloads run only after an explicit action; short tap,
 * double-tap zoom, pinch and pager swiping are untouched.
 */
@Composable
fun ImageActionSheet(url: String, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val coordinator = remember(url) {
        ImageActionCoordinator(
            HttpImageBytesSource(),
            AndroidImageActionSink(context, "${context.packageName}.fileprovider"),
        )
    }
    var working by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = { if (!working) onDismiss() }) {
        Surface(shape = RoundedCornerShape(22.dp), color = NoirColors.CardTop) {
            Column(Modifier.fillMaxWidth().padding(horizontal = 22.dp, vertical = 18.dp)) {
                Text(
                    "Photo actions",
                    color = NoirColors.Champagne, fontSize = 14.sp, fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(10.dp))
                listOf(
                    ImageAction.COPY to "Copy image",
                    ImageAction.SAVE to "Save to Gallery",
                    ImageAction.SHARE to "Share image",
                ).forEach { (action, label) ->
                    TextButton(
                        enabled = !working,
                        onClick = {
                            working = true
                            status = "Downloading full-size photo…"
                            scope.launch {
                                when (val result = coordinator.perform(action, url)) {
                                    ImageActionResult.Copied -> {
                                        Toast.makeText(context, "Image copied", Toast.LENGTH_SHORT).show()
                                        onDismiss()
                                    }
                                    is ImageActionResult.Saved -> {
                                        Toast.makeText(context, "Saved to ${result.location}", Toast.LENGTH_SHORT).show()
                                        onDismiss()
                                    }
                                    ImageActionResult.Shared -> onDismiss()
                                    is ImageActionResult.Failed -> {
                                        working = false
                                        status = result.message
                                    }
                                }
                            }
                        }
                    ) {
                        Text(label, color = NoirColors.Champagne, fontSize = 13.sp)
                    }
                }
                status?.let {
                    Spacer(Modifier.height(2.dp))
                    Text(it, color = NoirColors.Muted, fontSize = 12.sp)
                }
                Spacer(Modifier.height(6.dp))
                TextButton(enabled = !working, onClick = onDismiss) {
                    Text(if (working) "WORKING…" else "CANCEL", color = NoirColors.Muted, fontSize = 12.sp)
                }
            }
        }
    }
}
