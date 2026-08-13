package com.findmucker.casa

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun CasaApp(casaViewModel: CasaViewModel = viewModel()) {
    val state by casaViewModel.uiState.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = CasinhaPalette.Background,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color(0xFFFFEAF2),
                            Color(0xFFFFF8FB),
                            Color(0xFFF5EEFF),
                        ),
                    ),
                )
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding(),
        ) {
            when (val session = state.session) {
                SessionState.Loading -> LoadingScreen()
                SessionState.SignedOut -> AuthScreen(
                    working = state.working,
                    error = state.error,
                    onSignIn = casaViewModel::signIn,
                    onRegister = casaViewModel::register,
                    onGoogle = casaViewModel::signInWithGoogle,
                    onClearError = casaViewModel::clearError,
                )
                is SessionState.NeedsHouse -> HouseSetupScreen(
                    profile = session.profile,
                    working = state.working,
                    error = state.error,
                    onCreate = casaViewModel::createHouse,
                    onJoin = casaViewModel::joinHouse,
                    onSignOut = casaViewModel::signOut,
                    onClearError = casaViewModel::clearError,
                )
                is SessionState.Ready -> HouseWelcomeScreen(
                    profile = session.profile,
                    house = session.house,
                    dashboard = state.dashboard,
                    working = state.working,
                    error = state.error,
                    onAdd = casaViewModel::addItem,
                    onToggle = casaViewModel::toggleItem,
                    onDelete = casaViewModel::deleteItem,
                    onSignOut = casaViewModel::signOut,
                    onClearError = casaViewModel::clearError,
                )
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🏡", fontSize = 54.sp)
            Spacer(Modifier.height(14.dp))
            CircularProgressIndicator(color = CasinhaPalette.Rose400)
            Text(
                "A abrir a nossa casinha…",
                modifier = Modifier.padding(top = 12.dp),
                color = CasinhaPalette.Rose500,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun AuthScreen(
    working: Boolean,
    error: String?,
    onSignIn: (String, String) -> Unit,
    onRegister: (String, String, String) -> Unit,
    onGoogle: (Context) -> Unit,
    onClearError: () -> Unit,
) {
    var registering by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(10.dp))
        Text("✦", color = CasinhaPalette.Purple400, fontSize = 22.sp)
        Text("🏡", fontSize = 68.sp)
        Text(
            text = "A Nossa Casinha",
            fontSize = 30.sp,
            fontWeight = FontWeight.ExtraBold,
            color = CasinhaPalette.Rose500,
        )
        Text(
            text = if (registering) "Vamos criar o teu cantinho" else "Bem-vindo de volta!",
            color = CasinhaPalette.Purple500,
            fontWeight = FontWeight.Medium,
        )
        Surface(
            modifier = Modifier.padding(top = 9.dp),
            shape = RoundedCornerShape(50),
            color = Color.White.copy(alpha = 0.72f),
        ) {
            Text(
                "ANDROID NATIVO · SEM BROWSER",
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                color = CasinhaPalette.Rose500,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp,
            )
        }

        AuthModeSelector(
            registering = registering,
            onSelect = {
                registering = it
                onClearError()
            },
        )

        if (registering) {
            CasinhaTextField(
                value = name,
                onValueChange = { name = it; onClearError() },
                label = "O teu nome…",
                icon = Icons.Rounded.Person,
            )
            Spacer(Modifier.height(11.dp))
        }
        CasinhaTextField(
            value = email,
            onValueChange = { email = it; onClearError() },
            label = "Email…",
            icon = Icons.Rounded.Mail,
            keyboardType = KeyboardType.Email,
        )
        Spacer(Modifier.height(11.dp))
        CasinhaTextField(
            value = password,
            onValueChange = { password = it; onClearError() },
            label = "Palavra-passe…",
            icon = Icons.Rounded.Lock,
            keyboardType = KeyboardType.Password,
            password = true,
        )
        ErrorText(error)
        GradientPrimaryButton(
            text = if (registering) "Criar conta" else "Entrar",
            working = working,
            enabled = !working,
            onClick = {
                if (registering) onRegister(name, email, password) else onSignIn(email, password)
            },
        )

        Row(
            modifier = Modifier.padding(vertical = 17.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            HorizontalDivider(modifier = Modifier.weight(1f), color = CasinhaPalette.Pink200)
            Text("ou", modifier = Modifier.padding(horizontal = 12.dp), color = CasinhaPalette.Rose300, fontSize = 12.sp)
            HorizontalDivider(modifier = Modifier.weight(1f), color = CasinhaPalette.Pink200)
        }
        OutlinedButton(
            onClick = { onGoogle(context) },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            enabled = !working,
            shape = RoundedCornerShape(18.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, CasinhaPalette.Pink200),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color.White.copy(alpha = 0.82f),
                contentColor = CasinhaPalette.Rose600,
            ),
        ) {
            Text("G", modifier = Modifier.padding(end = 10.dp), fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
            Text("Continuar com Google", fontWeight = FontWeight.SemiBold)
        }
        TextButton(
            onClick = {
                registering = !registering
                onClearError()
            },
            enabled = !working,
        ) {
            Text(
                if (registering) "Já tenho conta" else "Ainda não tenho conta",
                color = CasinhaPalette.Purple500,
            )
        }
    }
}

@Composable
private fun AuthModeSelector(registering: Boolean, onSelect: (Boolean) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 22.dp, bottom = 17.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(CasinhaPalette.Pink100.copy(alpha = 0.66f))
            .padding(4.dp),
    ) {
        listOf(false to "Entrar", true to "Registar").forEach { (registerMode, label) ->
            val selected = registering == registerMode
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (selected) Color.White else Color.Transparent)
                    .clickable { onSelect(registerMode) }
                    .padding(vertical = 11.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    color = if (selected) CasinhaPalette.Rose600 else CasinhaPalette.Rose400,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                )
            }
        }
    }
}

@Composable
private fun CasinhaTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    icon: ImageVector,
    keyboardType: KeyboardType = KeyboardType.Text,
    password: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        leadingIcon = { Icon(icon, contentDescription = null, tint = CasinhaPalette.Rose300) },
        visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        singleLine = true,
        shape = RoundedCornerShape(18.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = CasinhaPalette.Rose400,
            unfocusedBorderColor = CasinhaPalette.Pink200,
            focusedContainerColor = Color.White.copy(alpha = 0.92f),
            unfocusedContainerColor = Color.White.copy(alpha = 0.82f),
            cursorColor = CasinhaPalette.Rose500,
            focusedLabelColor = CasinhaPalette.Rose500,
            unfocusedLabelColor = CasinhaPalette.Rose300,
        ),
    )
}

@Composable
private fun GradientPrimaryButton(
    text: String,
    working: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shape = RoundedCornerShape(18.dp)
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .alpha(if (enabled) 1f else 0.48f)
            .background(
                Brush.horizontalGradient(
                    listOf(CasinhaPalette.Rose400, CasinhaPalette.Rose500, CasinhaPalette.Purple500),
                ),
                shape,
            ),
        enabled = enabled,
        shape = shape,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent,
            contentColor = Color.White,
            disabledContentColor = Color.White,
        ),
    ) {
        if (working) {
            CircularProgressIndicator(
                modifier = Modifier.height(21.dp),
                strokeWidth = 2.dp,
                color = Color.White,
            )
        } else {
            Text(text, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HouseSetupScreen(
    profile: UserProfile,
    working: Boolean,
    error: String?,
    onCreate: (String) -> Unit,
    onJoin: (String) -> Unit,
    onSignOut: () -> Unit,
    onClearError: () -> Unit,
) {
    var houseName by remember { mutableStateOf("") }
    var inviteCode by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("🏡", fontSize = 64.sp)
        Text(
            "Olá, ${profile.name}!",
            fontSize = 28.sp,
            fontWeight = FontWeight.ExtraBold,
            color = CasinhaPalette.Rose500,
        )
        Text(
            "Vamos encontrar o teu cantinho.",
            modifier = Modifier.padding(top = 4.dp, bottom = 22.dp),
            textAlign = TextAlign.Center,
            color = CasinhaPalette.Purple500,
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            color = Color.White.copy(alpha = 0.76f),
            shadowElevation = 6.dp,
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("✨ Criar uma casa", color = CasinhaPalette.Rose600, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                CasinhaTextField(
                    value = houseName,
                    onValueChange = { houseName = it; onClearError() },
                    label = "Nome da nova casa…",
                    icon = Icons.Rounded.Person,
                )
                GradientPrimaryButton(
                    text = "Criar casa",
                    working = working,
                    enabled = !working,
                    onClick = { onCreate(houseName) },
                    modifier = Modifier.padding(top = 12.dp),
                )

                Row(
                    modifier = Modifier.padding(vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = CasinhaPalette.Pink200)
                    Text("ou", modifier = Modifier.padding(horizontal = 10.dp), color = CasinhaPalette.Rose300)
                    HorizontalDivider(modifier = Modifier.weight(1f), color = CasinhaPalette.Pink200)
                }

                Text("💌 Tenho um convite", color = CasinhaPalette.Purple500, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                CasinhaTextField(
                    value = inviteCode,
                    onValueChange = { inviteCode = it.uppercase(); onClearError() },
                    label = "Código do convite…",
                    icon = Icons.Rounded.Mail,
                )
                OutlinedButton(
                    onClick = { onJoin(inviteCode) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .padding(top = 10.dp),
                    enabled = !working,
                    shape = RoundedCornerShape(18.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CasinhaPalette.Purple400),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = CasinhaPalette.Purple500),
                ) { Text("Entrar na casa", fontWeight = FontWeight.Bold) }
            }
        }
        ErrorText(error)
        TextButton(onClick = onSignOut, enabled = !working) {
            Text("Terminar sessão", color = CasinhaPalette.MutedInk)
        }
    }
}

@Composable
private fun ErrorText(error: String?) {
    if (error != null) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            shape = RoundedCornerShape(14.dp),
            color = Color(0xFFFFE4E8),
        ) {
            Text(
                text = error,
                modifier = Modifier.padding(12.dp),
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                fontSize = 13.sp,
            )
        }
    } else {
        Spacer(Modifier.height(15.dp))
    }
}
