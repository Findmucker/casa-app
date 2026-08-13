package com.findmucker.casa

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class FirebaseCasaRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    val hasAuthenticatedUser: Boolean
        get() = auth.currentUser != null

    suspend fun restoreSession(): SessionState {
        val user = auth.currentUser ?: return SessionState.SignedOut
        return loadSession(user)
    }

    suspend fun signIn(email: String, password: String): SessionState {
        val credential = auth
            .signInWithEmailAndPassword(email.trim().lowercase(), password)
            .await()
        return loadSession(requireNotNull(credential.user))
    }

    suspend fun register(name: String, email: String, password: String): SessionState {
        val cleanName = name.trim()
        val cleanEmail = email.trim().lowercase()
        val credential = auth.createUserWithEmailAndPassword(cleanEmail, password).await()
        val user = requireNotNull(credential.user)

        firestore.collection("users").document(user.uid).set(
            mapOf(
                "name" to cleanName,
                "email" to cleanEmail,
                "birthDate" to null,
                "avatar" to "👤",
                "houseId" to null,
                "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()

        return loadSession(user)
    }

    suspend fun signInWithGoogle(context: Context): SessionState {
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(WEB_CLIENT_ID)
            .setAutoSelectEnabled(false)
            .build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()
        val result = CredentialManager.create(context).getCredential(context, request)
        val credential = result.credential

        require(credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            "A conta selecionada não devolveu uma credencial Google válida."
        }

        val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
        val firebaseCredential = GoogleAuthProvider.getCredential(googleCredential.idToken, null)
        val authResult = auth.signInWithCredential(firebaseCredential).await()
        return loadSession(requireNotNull(authResult.user))
    }

    suspend fun createHouse(profile: UserProfile, houseName: String): SessionState {
        val cleanName = houseName.trim()
        require(cleanName.isNotEmpty()) { "Escreve um nome para a casa." }
        require(cleanName.length <= 30) { "O nome da casa pode ter no máximo 30 caracteres." }

        val houseRef = firestore.collection("houses").document()
        houseRef.set(
            mapOf(
                "name" to cleanName,
                "members" to listOf(
                    mapOf(
                        "uid" to profile.uid,
                        "name" to profile.name,
                        "avatar" to profile.avatar,
                        "role" to "admin",
                    ),
                ),
                "memberUids" to listOf(profile.uid),
                "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
        firestore.collection("users").document(profile.uid)
            .update("houseId", houseRef.id)
            .await()

        return loadSession(requireNotNull(auth.currentUser))
    }

    suspend fun joinHouse(profile: UserProfile, inviteCode: String): SessionState {
        val code = inviteCode.trim().uppercase()
        require(code.isNotEmpty()) { "Escreve o código do convite." }

        val invite = firestore.collection("invites").document(code).get().await()
        require(invite.exists()) { "Este convite não existe." }
        val expiresAt = invite.getString("expiresAt")
        if (expiresAt != null) {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            require(runCatching { parser.parse(expiresAt)?.after(Date()) == true }.getOrDefault(false)) {
                "Este convite já expirou."
            }
        }
        val houseId = requireNotNull(invite.getString("houseId")) { "O convite não tem uma casa válida." }
        val member = mapOf(
            "uid" to profile.uid,
            "name" to profile.name,
            "avatar" to profile.avatar,
            "role" to "member",
        )

        firestore.collection("houses").document(houseId).update(
            mapOf(
                "members" to FieldValue.arrayUnion(member),
                "memberUids" to FieldValue.arrayUnion(profile.uid),
            ),
        ).await()
        firestore.collection("users").document(profile.uid).update("houseId", houseId).await()

        return loadSession(requireNotNull(auth.currentUser))
    }

    fun signOut() {
        auth.signOut()
    }

    private suspend fun loadSession(user: FirebaseUser): SessionState {
        val userRef = firestore.collection("users").document(user.uid)
        var snapshot = userRef.get().await()
        if (!snapshot.exists()) {
            userRef.set(
                mapOf(
                    "name" to (user.displayName ?: user.email?.substringBefore('@') ?: "Pessoa"),
                    "email" to user.email?.lowercase(),
                    "birthDate" to null,
                    "avatar" to "👤",
                    "houseId" to null,
                    "createdAt" to FieldValue.serverTimestamp(),
                ),
            ).await()
            snapshot = userRef.get().await()
        }

        val profile = UserProfile(
            uid = user.uid,
            name = snapshot.getString("name") ?: user.displayName ?: "Pessoa",
            email = snapshot.getString("email") ?: user.email,
            avatar = snapshot.getString("avatar") ?: "👤",
            houseId = snapshot.getString("houseId"),
        )
        val houseId = profile.houseId ?: return SessionState.NeedsHouse(profile)
        val houseDocument = firestore.collection("houses").document(houseId).get().await()
        if (!houseDocument.exists()) return SessionState.NeedsHouse(profile.copy(houseId = null))

        @Suppress("UNCHECKED_CAST")
        val members = (houseDocument.get("members") as? List<Map<String, Any?>>).orEmpty().map { member ->
            HouseMember(
                uid = member["uid"] as? String ?: "",
                name = member["name"] as? String ?: "Pessoa",
                avatar = member["avatar"] as? String ?: "👤",
                role = member["role"] as? String ?: "member",
            )
        }
        return SessionState.Ready(
            profile = profile,
            house = House(
                id = houseId,
                name = houseDocument.getString("name") ?: "Casa",
                members = members,
            ),
        )
    }

    companion object {
        private const val WEB_CLIENT_ID =
            "776757654663-4j0u4nelqulc5v28asuq972ots5cd8a8.apps.googleusercontent.com"

        fun friendlyError(error: Throwable): String = when (error) {
            is GetCredentialException -> "Não foi possível escolher a conta Google. Confirma os Serviços Google Play e tenta novamente."
            is FirebaseAuthException -> when (error.errorCode) {
                "ERROR_INVALID_EMAIL" -> "O endereço de email não é válido."
                "ERROR_INVALID_CREDENTIAL", "ERROR_WRONG_PASSWORD", "ERROR_USER_NOT_FOUND" ->
                    "Email ou palavra-passe incorretos."
                "ERROR_EMAIL_ALREADY_IN_USE" -> "Já existe uma conta com este email."
                "ERROR_WEAK_PASSWORD" -> "Escolhe uma palavra-passe com pelo menos 6 caracteres."
                "ERROR_NETWORK_REQUEST_FAILED" -> "Sem ligação ao serviço. Confirma a internet e tenta novamente."
                else -> error.localizedMessage ?: "Não foi possível autenticar."
            }
            else -> error.message ?: "Ocorreu um erro inesperado."
        }
    }
}
