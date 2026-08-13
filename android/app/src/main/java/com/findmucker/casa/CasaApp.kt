package com.findmucker.casa

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Mail
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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

@Composable
fun CasaApp(casaViewModel: CasaViewModel = viewModel()) {
    val state by casaViewModel.uiState.collectAsState()

    Surface(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFFFFF1F6), Color(0xFFFFFBFD)),
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
        CircularProgressIndicator()
    }
}

@Composable
private fun AuthScreen(
    working: Boolean,
    error: String?,
    onSignIn: (String, String) -> Unit,
    onRegister: (String, String, String) -> Unit,
    onGoogle: (android.content.Context) -> Unit,
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
            .padding(horizontal = 28.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(28.dp))
        Icon(
            imageVector = Icons.Rounded.Home,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = "A Nossa Casinha",
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            text = if (registering) "Cria a tua conta" else "Bem-vindo de volta",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(28.dp))

        if (registering) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it; onClearError() },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Nome") },
                leadingIcon = { Icon(Icons.Rounded.Person, contentDescription = null) },
                singleLine = true,
            )
            Spacer(Modifier.height(12.dp))
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it; onClearError() },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Email") },
            leadingIcon = { Icon(Icons.Rounded.Mail, contentDescription = null) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it; onClearError() },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Palavra-passe") },
            leadingIcon = { Icon(Icons.Rounded.Lock, contentDescription = null) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
        )
        ErrorText(error)
        Button(
            onClick = {
                if (registering) onRegister(name, email, password) else onSignIn(email, password)
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !working,
        ) {
            if (working) {
                CircularProgressIndicator(
                    modifier = Modifier.height(20.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            } else {
                Text(if (registering) "Criar conta" else "Entrar")
            }
        }
        Spacer(Modifier.height(14.dp))
        HorizontalDivider()
        Spacer(Modifier.height(14.dp))
        OutlinedButton(
            onClick = { onGoogle(context) },
            modifier = Modifier.fillMaxWidth(),
            enabled = !working,
        ) {
            Text("Continuar com Google")
        }
        TextButton(
            onClick = {
                registering = !registering
                onClearError()
            },
            enabled = !working,
        ) {
            Text(if (registering) "Já tenho conta" else "Criar uma conta")
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
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Olá, ${profile.name}!", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text(
            "Cria uma casa nova ou entra com o código de convite.",
            modifier = Modifier.padding(top = 8.dp, bottom = 28.dp),
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedTextField(
            value = houseName,
            onValueChange = { houseName = it; onClearError() },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Nome da nova casa") },
            singleLine = true,
        )
        Button(
            onClick = { onCreate(houseName) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            enabled = !working,
        ) { Text("Criar casa") }
        Text("ou", modifier = Modifier.padding(18.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(
            value = inviteCode,
            onValueChange = { inviteCode = it.uppercase(); onClearError() },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Código do convite") },
            singleLine = true,
        )
        OutlinedButton(
            onClick = { onJoin(inviteCode) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            enabled = !working,
        ) { Text("Entrar na casa") }
        ErrorText(error)
        if (working) CircularProgressIndicator(modifier = Modifier.padding(8.dp))
        TextButton(onClick = onSignOut, enabled = !working) { Text("Terminar sessão") }
    }
}

@Composable
private fun ErrorText(error: String?) {
    if (error != null) {
        Text(
            text = error,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
        )
    } else {
        Spacer(Modifier.height(16.dp))
    }
}
