package com.findmucker.casa

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val basicAnimals = AvatarOptions.getValue(AvatarSlot.ANIMAL).filter { it.id in 0..10 }

@Composable
fun AvatarCharacter(
    avatar: AvatarConfig,
    equipped: Map<LootSlot, String> = emptyMap(),
    modifier: Modifier = Modifier,
    compact: Boolean = false,
) {
    val animal = basicAnimals.firstOrNull { it.id == avatar.animal }?.preview ?: "🐼"
    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = Color.White.copy(alpha = 0.78f),
        border = BorderStroke(1.dp, CasinhaPalette.Pink200.copy(alpha = 0.7f)),
        shadowElevation = 0.dp,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(if (compact) 6.dp else 18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(animal, fontSize = if (compact) 36.sp else 80.sp, textAlign = TextAlign.Center)
        }
    }
}

@Composable
fun AvatarEditor(
    savedAvatar: AvatarConfig,
    working: Boolean,
    onSave: (AvatarConfig) -> Unit,
) {
    var avatar by remember(savedAvatar) { mutableStateOf(savedAvatar.copy(
        eyes = 0,
        mouth = 0,
        top = 0,
        bottom = 0,
        accessory = 0,
        background = 0,
        effect = 0,
    )) }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            "Escolhe o teu animal",
            color = CasinhaPalette.Rose600,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
        )
        AvatarCharacter(avatar, modifier = Modifier.size(132.dp).align(Alignment.CenterHorizontally))
        basicAnimals.chunked(4).forEach { group ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                group.forEach { option ->
                    val selected = avatar.animal == option.id
                    Surface(
                        modifier = Modifier.weight(1f).clickable { avatar = avatar.copy(animal = option.id) },
                        shape = CircleShape,
                        color = if (selected) CasinhaPalette.Pink100 else Color.White.copy(alpha = 0.72f),
                        border = BorderStroke(
                            if (selected) 2.dp else 1.dp,
                            if (selected) CasinhaPalette.Rose400 else CasinhaPalette.Pink200,
                        ),
                        shadowElevation = 0.dp,
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 10.dp, horizontal = 4.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(option.preview, fontSize = 27.sp)
                            Text(option.name, color = CasinhaPalette.Rose600, fontSize = 8.sp, maxLines = 1)
                        }
                    }
                }
                repeat(4 - group.size) {
                    androidx.compose.foundation.layout.Spacer(Modifier.weight(1f))
                }
            }
        }
        GradientActionButton(
            "Guardar animal",
            { onSave(avatar) },
            Modifier.fillMaxWidth(),
            enabled = !working,
        )
    }
}
