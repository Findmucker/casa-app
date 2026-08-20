package com.findmucker.casa

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.core.content.ContextCompat

@Composable
fun CasaApp(casaViewModel: CasaViewModel = viewModel()) {
    val state by casaViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val notificationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) casaViewModel.registerPushToken()
    }

    LaunchedEffect((state.session as? SessionState.Ready)?.profile?.uid) {
        if (state.session !is SessionState.Ready) return@LaunchedEffect
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        ) {
            casaViewModel.registerPushToken()
        } else {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = CasinhaPalette.Background) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(CasinhaBackgroundBrush)
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
                    state = state,
                    onAdd = casaViewModel::addItem,
                    onAddDetailed = casaViewModel::addItem,
                    onToggle = casaViewModel::toggleItem,
                    onDelete = casaViewModel::deleteItem,
                    onUpdateItem = casaViewModel::updateItem,
                    onMoveItem = casaViewModel::moveItem,
                    onAddSubtask = casaViewModel::addSubtask,
                    onToggleSubtask = casaViewModel::toggleSubtask,
                    onDeleteSubtask = casaViewModel::deleteSubtask,
                    onAddExpense = casaViewModel::addExpense,
                    onAddIncome = casaViewModel::addIncome,
                    onAddSavings = casaViewModel::addSavingsGoal,
                    onDepositSavings = casaViewModel::depositSavings,
                    onDeleteExtra = casaViewModel::deleteExtra,
                    onAddEvent = casaViewModel::addEvent,
                    onToggleEvent = casaViewModel::toggleEvent,
                    onUpdateEvent = casaViewModel::updateEvent,
                    onAddEventItem = casaViewModel::addEventItem,
                    onToggleEventItem = casaViewModel::toggleEventItem,
                    onAssignEventItem = casaViewModel::assignEventItem,
                    onRenameEventItem = casaViewModel::renameEventItem,
                    onDeleteEventItem = casaViewModel::deleteEventItem,
                    onCloneEvent = casaViewModel::cloneEvent,
                    onShareEvent = casaViewModel::shareEvent,
                    onConsumeShareUrl = casaViewModel::consumeShareUrl,
                    onRenameHouse = casaViewModel::renameHouse,
                    onUpdateProfile = casaViewModel::updateProfile,
                    onSaveAvatar = casaViewModel::saveAvatar,
                    onCreateInvite = casaViewModel::createInvite,
                    onLoadFriendCode = casaViewModel::loadFriendCode,
                    onConnectFriend = casaViewModel::connectFriend,
                    onRemoveFriend = casaViewModel::removeFriend,
                    onSendMessage = casaViewModel::sendMessage,
                    onRefreshWeather = casaViewModel::refreshWeather,
                    onSearchWeather = casaViewModel::searchWeatherLocations,
                    onSelectWeather = casaViewModel::selectWeatherLocation,
                    onSelectFavoriteWeather = casaViewModel::selectFavoriteWeatherLocation,
                    onAddWeatherFavorite = casaViewModel::addWeatherFavorite,
                    onRemoveWeatherFavorite = casaViewModel::removeWeatherFavorite,
                    onUseDefaultWeather = casaViewModel::useDefaultWeatherLocation,
                    onUseCurrentWeather = casaViewModel::useCurrentWeatherLocation,
                    onSignOut = casaViewModel::signOut,
                    onClearError = casaViewModel::clearError,
                    onClearNotice = casaViewModel::clearNotice,
                )
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🏡", fontSize = 62.sp)
            CircularProgressIndicator(color = CasinhaPalette.Rose400, modifier = Modifier.padding(top = 18.dp))
        }
    }
}

@Composable
private fun AuthScreen(
    working: Boolean,
    error: String?,
    onSignIn: (String, String) -> Unit,
    onRegister: (String, String, String, String) -> Unit,
    onGoogle: (Context) -> Unit,
    onClearError: () -> Unit,
) {
    var registering by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var birthDate by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var locale by remember { mutableStateOf("pt") }
    val context = LocalContext.current

    Box(modifier = Modifier.fillMaxSize()) {
        Row(modifier = Modifier.align(Alignment.TopEnd).padding(16.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            LanguagePill("🇵🇹 PT", locale == "pt") { locale = "pt" }
            LanguagePill("🇬🇧 EN", locale == "en") { locale = "en" }
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 30.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text("🏡", fontSize = 70.sp)
            Text("A Nossa Casinha", color = CasinhaPalette.Rose400, fontSize = 24.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))
            Text(
                if (registering) (if (locale == "pt") "Criar nova conta" else "Create a new account") else (if (locale == "pt") "Bem-vindo de volta!" else "Welcome back!"),
                color = CasinhaPalette.Rose300, fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp),
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 24.dp).background(CasinhaPalette.Pink100.copy(alpha = 0.55f), RoundedCornerShape(16.dp)).padding(4.dp),
            ) {
                AuthModeButton(if (locale == "pt") "Entrar" else "Sign in", !registering, Modifier.weight(1f)) { registering = false; onClearError() }
                AuthModeButton(if (locale == "pt") "Registar" else "Register", registering, Modifier.weight(1f)) { registering = true; onClearError() }
            }

            Column(modifier = Modifier.fillMaxWidth().padding(top = 20.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                if (registering) {
                    WebLikeInput(name, { name = it; onClearError() }, if (locale == "pt") "O teu nome..." else "Your name...")
                    CasinhaInput(
                        birthDate,
                        { birthDate = it; onClearError() },
                        if (locale == "pt") "🎂 Data de nascimento (AAAA-MM-DD)" else "🎂 Birth date (YYYY-MM-DD)",
                        Modifier.fillMaxWidth(),
                    )
                }
                WebLikeInput(email, { email = it; onClearError() }, "Email...", KeyboardType.Email)
                WebLikeInput(password, { password = it; onClearError() }, if (locale == "pt") "Password..." else "Password...", KeyboardType.Password, password = true)
            }

            if (error != null) Text(error, color = CasinhaPalette.Rose400, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
            GradientActionButton(
                text = if (working) "..." else if (registering) (if (locale == "pt") "Criar conta" else "Create account") else (if (locale == "pt") "Entrar" else "Sign in"),
                onClick = { if (registering) onRegister(name, email, password, birthDate) else onSignIn(email, password) },
                modifier = Modifier.fillMaxWidth().padding(top = 18.dp).height(48.dp),
                enabled = !working && email.isNotBlank() && password.isNotBlank(),
            )
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 17.dp), verticalAlignment = Alignment.CenterVertically) {
                HorizontalDivider(modifier = Modifier.weight(1f), color = CasinhaPalette.Pink200.copy(alpha = 0.45f))
                Text(if (locale == "pt") "ou" else "or", color = CasinhaPalette.Pink300, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 12.dp))
                HorizontalDivider(modifier = Modifier.weight(1f), color = CasinhaPalette.Pink200.copy(alpha = 0.45f))
            }
            OutlinedButton(
                onClick = { onGoogle(context) }, modifier = Modifier.fillMaxWidth().height(48.dp), enabled = !working,
                shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, CasinhaPalette.Pink200.copy(alpha = 0.65f)),
                colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White.copy(alpha = 0.8f), contentColor = CasinhaPalette.Rose600),
            ) {
                Text("G", fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(end = 9.dp))
                Text(if (locale == "pt") "Continuar com Google" else "Continue with Google", fontSize = 13.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun LanguagePill(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(modifier = Modifier.clickable(onClick = onClick), shape = CircleShape, color = if (selected) CasinhaPalette.Rose400 else Color.White.copy(alpha = 0.64f)) {
        Text(label, color = if (selected) Color.White else CasinhaPalette.Rose400, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp))
    }
}

@Composable
private fun AuthModeButton(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Surface(modifier = modifier.clickable(onClick = onClick), shape = RoundedCornerShape(12.dp), color = if (selected) Color.White else Color.Transparent, shadowElevation = if (selected) 1.dp else 0.dp) {
        Text(label, color = if (selected) CasinhaPalette.Rose600 else CasinhaPalette.Pink400, fontWeight = FontWeight.Medium, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(vertical = 10.dp))
    }
}

@Composable
private fun WebLikeInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    password: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text(placeholder, color = CasinhaPalette.Pink300, fontSize = 13.sp) },
        singleLine = true,
        shape = RoundedCornerShape(16.dp),
        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = keyboardType),
        visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = CasinhaPalette.Pink300,
            unfocusedBorderColor = CasinhaPalette.Pink200.copy(alpha = 0.62f),
            focusedContainerColor = Color.White.copy(alpha = 0.82f),
            unfocusedContainerColor = Color.White.copy(alpha = 0.78f),
            cursorColor = CasinhaPalette.Rose400,
            focusedTextColor = CasinhaPalette.Rose700,
            unfocusedTextColor = CasinhaPalette.Rose700,
        ),
    )
}

private enum class SetupMode { CHOOSE, CREATE, JOIN }

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
    var mode by remember { mutableStateOf(SetupMode.CHOOSE) }
    var houseName by remember { mutableStateOf("A Nossa Casinha") }
    var inviteCode by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("🏡", fontSize = 62.sp)
        Text("Olá, ${profile.name}!", color = CasinhaPalette.Rose400, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 10.dp))
        Text("Vamos configurar a tua casa", color = CasinhaPalette.Rose300, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 22.dp))
        when (mode) {
            SetupMode.CHOOSE -> {
                SetupChoice("✨", "Criar nova casa", "Começar do zero") { mode = SetupMode.CREATE; onClearError() }
                SetupChoice("🔗", "Tenho um convite", "Juntar-me a uma casa existente", Modifier.padding(top = 11.dp)) { mode = SetupMode.JOIN; onClearError() }
            }
            SetupMode.CREATE -> {
                WebLikeInput(houseName, { houseName = it; onClearError() }, "Nome da casa...")
                GradientActionButton(if (working) "A criar..." else "Criar casa 🏡", { onCreate(houseName) }, Modifier.fillMaxWidth().padding(top = 14.dp).height(48.dp), enabled = houseName.isNotBlank() && !working)
                TextButton(onClick = { mode = SetupMode.CHOOSE }) { Text("← Voltar", color = CasinhaPalette.Pink400) }
            }
            SetupMode.JOIN -> {
                WebLikeInput(inviteCode, { inviteCode = it.uppercase(); onClearError() }, "Código do convite...")
                GradientActionButton(if (working) "A verificar..." else "Juntar-me 🔗", { onJoin(inviteCode) }, Modifier.fillMaxWidth().padding(top = 14.dp).height(48.dp), enabled = inviteCode.length >= 4 && !working)
                TextButton(onClick = { mode = SetupMode.CHOOSE }) { Text("← Voltar", color = CasinhaPalette.Pink400) }
            }
        }
        if (error != null) Text(error, color = CasinhaPalette.Rose400, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
        TextButton(onClick = onSignOut, enabled = !working, modifier = Modifier.padding(top = 12.dp)) { Text("Sair", color = CasinhaPalette.Pink300, fontSize = 11.sp) }
    }
}

@Composable
private fun SetupChoice(emoji: String, title: String, subtitle: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    GlassCard(modifier = modifier.fillMaxWidth().clickable(onClick = onClick), color = Color.White.copy(alpha = 0.8f), contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 18.dp, vertical = 15.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(emoji, fontSize = 26.sp)
            Column(modifier = Modifier.padding(start = 12.dp)) {
                Text(title, color = CasinhaPalette.Rose700, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(subtitle, color = CasinhaPalette.Pink400, fontSize = 10.sp)
            }
        }
    }
}
