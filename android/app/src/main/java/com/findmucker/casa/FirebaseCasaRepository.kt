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
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.math.roundToInt

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
        val credential = auth.signInWithEmailAndPassword(email.trim().lowercase(), password).await()
        return loadSession(requireNotNull(credential.user))
    }

    suspend fun register(name: String, email: String, password: String, birthDate: String): SessionState {
        val cleanName = name.trim()
        val cleanEmail = email.trim().lowercase()
        val credential = auth.createUserWithEmailAndPassword(cleanEmail, password).await()
        val user = requireNotNull(credential.user)

        firestore.collection("users").document(user.uid).set(
            mapOf(
                "name" to cleanName,
                "email" to cleanEmail,
                "birthDate" to birthDate,
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
        val request = GetCredentialRequest.Builder().addCredentialOption(googleIdOption).build()
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
        firestore.collection("users").document(profile.uid).update("houseId", houseRef.id).await()
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

    fun signOut() = auth.signOut()

    suspend fun registerNotificationToken(userId: String) {
        val token = FirebaseMessaging.getInstance().token.await()
        firestore.collection("fcm_tokens").document(userId).set(
            mapOf(
                "uid" to userId,
                "token" to token,
                "platform" to "android",
                "updatedAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
    }

    fun observeItems(
        houseId: String,
        section: HouseSection,
        onResult: (Result<List<HouseItem>>) -> Unit,
    ): ListenerRegistration = houseCollection(houseId, section.collection)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onResult(Result.failure(error))
                return@addSnapshotListener
            }
            val today = today()
            val items = snapshot?.documents.orEmpty().map { document ->
                val status = document.getString("status")
                HouseItem(
                    id = document.id,
                    name = document.getString("name") ?: "Sem nome",
                    done = when (section) {
                        HouseSection.PROJECTS -> status == "concluido"
                        HouseSection.HABITS -> document.getString("lastChecked") == today
                        else -> document.getBoolean("done") ?: false
                    },
                    status = status,
                    emoji = document.getString("emoji"),
                    urgent = document.getBoolean("urgent") ?: false,
                    streak = document.getLong("streak")?.toInt() ?: 0,
                    notes = document.getString("notes"),
                    order = document.getLong("order") ?: 0,
                    category = document.getString("category"),
                    addedBy = document.getString("addedBy"),
                    assignee = document.getString("assignee"),
                    completedAt = document.getString("completedAt"),
                    price = document.number("price"),
                    budget = document.number("budget"),
                    spent = document.number("spent"),
                    reminderTime = document.getString("reminderTime"),
                    days = (document.get("days") as? List<*>)?.mapNotNull { (it as? Number)?.toInt() }.orEmpty(),
                    subtasks = (document.get("subtasks") as? List<*>)?.mapNotNull { raw ->
                        val value = raw as? Map<*, *> ?: return@mapNotNull null
                        Subtask(
                            id = value["id"] as? String ?: "",
                            name = value["name"] as? String ?: return@mapNotNull null,
                            done = value["done"] as? Boolean ?: false,
                        )
                    }.orEmpty(),
                )
            }.let { unsorted ->
                when (section) {
                    HouseSection.SMALL_PRIORITIES, HouseSection.PROJECTS -> unsorted.sortedBy { it.order }
                    else -> unsorted.sortedWith(compareBy<HouseItem> { it.done }.thenBy { it.name.lowercase() })
                }
            }
            onResult(Result.success(items))
        }

    fun observeHabitChecks(houseId: String, onResult: (Result<List<HabitCheck>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "habit_checks").addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            onResult(Result.success(snapshot?.documents.orEmpty().map {
                HabitCheck(it.id, it.getString("habitId") ?: "", it.getString("date") ?: "")
            }))
        }

    fun observeExpenses(houseId: String, onResult: (Result<List<ExpenseItem>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "expenses").addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            onResult(Result.success(snapshot?.documents.orEmpty().map {
                ExpenseItem(
                    id = it.id,
                    name = it.getString("name") ?: "Sem nome",
                    amount = it.number("amount") ?: 0.0,
                    category = it.getString("category") ?: "outros",
                    paidBy = it.getString("paidBy") ?: "ambos",
                    date = it.getString("date") ?: "",
                )
            }.sortedByDescending { it.date }))
        }

    fun observeIncomes(houseId: String, onResult: (Result<List<IncomeItem>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "income").addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            onResult(Result.success(snapshot?.documents.orEmpty().map {
                IncomeItem(
                    id = it.id,
                    name = it.getString("name") ?: "Sem nome",
                    amount = it.number("amount") ?: 0.0,
                    recurring = it.getBoolean("recurring") ?: false,
                    owner = it.getString("owner") ?: "ambos",
                    date = it.getString("date") ?: "",
                )
            }.sortedByDescending { it.date }))
        }

    fun observeSavings(houseId: String, onResult: (Result<List<SavingsGoal>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "savings_goals").addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            onResult(Result.success(snapshot?.documents.orEmpty().map {
                SavingsGoal(
                    id = it.id,
                    name = it.getString("name") ?: "Objetivo",
                    emoji = it.getString("emoji") ?: "🎯",
                    targetAmount = it.number("targetAmount") ?: 0.0,
                    currentAmount = it.number("currentAmount") ?: 0.0,
                    deadline = it.getString("deadline"),
                )
            }))
        }

    fun observeEvents(houseId: String, onResult: (Result<List<CasaEvent>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "events").addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            onResult(Result.success(snapshot?.documents.orEmpty().map {
                CasaEvent(
                    id = it.id,
                    title = it.getString("title") ?: "Evento",
                    date = it.getString("date") ?: "",
                    guests = it.getLong("guests")?.toInt() ?: 0,
                    participants = (it.get("participants") as? List<*>)?.filterIsInstance<String>().orEmpty(),
                    done = it.getBoolean("done") ?: false,
                )
            }.sortedWith(compareBy<CasaEvent> { it.done }.thenBy { it.date })))
        }

    fun observeEventItems(houseId: String, eventId: String, onResult: (Result<List<EventItem>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "events").document(eventId).collection("items")
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener onResult(Result.failure(error))
                onResult(Result.success(snapshot?.documents.orEmpty().map { document ->
                    EventItem(
                        id = document.id,
                        name = document.getString("name") ?: "Item",
                        done = document.getBoolean("done") ?: false,
                        type = document.getString("type") ?: "todo",
                        assignee = document.getString("assignee"),
                    )
                }))
            }

    fun observeFriends(houseId: String, onResult: (Result<List<FriendHouse>>) -> Unit): ListenerRegistration =
        houseCollection(houseId, "friends").addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            onResult(Result.success(snapshot?.documents.orEmpty().map {
                FriendHouse(
                    id = it.id,
                    houseId = it.getString("houseId") ?: it.id,
                    houseName = it.getString("houseName") ?: "Casa",
                    members = (it.get("members") as? List<*>)?.mapNotNull { member ->
                        (member as? Map<*, *>)?.get("name") as? String
                    }.orEmpty(),
                )
            }))
        }

    fun observeGamification(name: String, onResult: (Result<GamificationProfile>) -> Unit): ListenerRegistration =
        firestore.collection("gamification").document(name).addSnapshotListener { document, error ->
            if (error != null) return@addSnapshotListener onResult(Result.failure(error))
            val equipped = (document?.get("equipped") as? Map<*, *>)
                ?.mapNotNull { (key, value) ->
                    val slot = LootSlot.fromKey(key as? String ?: return@mapNotNull null)
                        ?: return@mapNotNull null
                    val itemId = value as? String ?: return@mapNotNull null
                    slot to itemId
                }
                ?.toMap()
                .orEmpty()
            val avatar = (document?.get("avatar") as? Map<*, *>)
                ?.let(::avatarConfigFromMap)
                ?: AvatarConfig()
            onResult(Result.success(GamificationProfile(
                points = document?.getLong("points")?.toInt() ?: 0,
                totalCompleted = document?.getLong("totalCompleted")?.toInt() ?: 0,
                maxStreak = document?.getLong("maxStreak")?.toInt() ?: 0,
                shoppingDone = document?.getLong("shoppingDone")?.toInt() ?: 0,
                coisinhasDone = document?.getLong("coisinhasDone")?.toInt() ?: 0,
                projectsDone = document?.getLong("projectsDone")?.toInt() ?: 0,
                habitsDone = document?.getLong("habitsDone")?.toInt() ?: 0,
                badges = (document?.get("badges") as? List<*>)?.filterIsInstance<String>().orEmpty(),
                inventory = (document?.get("inventory") as? List<*>)?.mapNotNull { raw ->
                    val item = raw as? Map<*, *> ?: return@mapNotNull null
                    InventoryItem(
                        itemId = item["itemId"] as? String ?: return@mapNotNull null,
                        count = (item["count"] as? Number)?.toInt() ?: 1,
                    )
                }.orEmpty(),
                equipped = equipped,
                boxesOpened = document?.getLong("boxesOpened")?.toInt() ?: 0,
                avatar = avatar,
            )))
        }

    suspend fun equipItem(owner: String, itemId: String, slot: LootSlot) {
        val ref = firestore.collection("gamification").document(owner)
        firestore.runTransaction { transaction ->
            val document = transaction.get(ref)
            val owned = (document.get("inventory") as? List<*>)?.any { raw ->
                (raw as? Map<*, *>)?.get("itemId") == itemId
            } == true
            require(owned) { "Esse item não está no teu inventário." }
            val item = CasinhaLoot.firstOrNull { it.id == itemId && it.slot == slot }
            requireNotNull(item) { "O item não pertence a esse slot." }
            val equipped = (document.get("equipped") as? Map<*, *>)
                ?.mapNotNull { (key, value) ->
                    val cleanKey = key as? String ?: return@mapNotNull null
                    val cleanValue = value as? String ?: return@mapNotNull null
                    cleanKey to cleanValue
                }
                ?.toMap()
                ?.toMutableMap()
                ?: mutableMapOf()
            equipped[slot.key] = itemId
            transaction.update(ref, "equipped", equipped)
        }.await()
    }

    suspend fun unequipItem(owner: String, slot: LootSlot) {
        val ref = firestore.collection("gamification").document(owner)
        firestore.runTransaction { transaction ->
            val document = transaction.get(ref)
            val equipped = (document.get("equipped") as? Map<*, *>)
                ?.mapNotNull { (key, value) ->
                    val cleanKey = key as? String ?: return@mapNotNull null
                    val cleanValue = value as? String ?: return@mapNotNull null
                    cleanKey to cleanValue
                }
                ?.toMap()
                ?.toMutableMap()
                ?: mutableMapOf()
            equipped.remove(slot.key)
            transaction.update(ref, "equipped", equipped)
        }.await()
    }

    suspend fun saveAvatar(owner: String, avatar: AvatarConfig) {
        firestore.collection("gamification").document(owner)
            .set(mapOf("avatar" to avatar.asFirestoreMap()), SetOptions.merge())
            .await()
    }

    suspend fun addItem(houseId: String, section: HouseSection, draft: ItemDraft, addedBy: String) {
        val cleanName = draft.name.trim()
        require(cleanName.isNotEmpty()) { "Escreve o nome do item." }
        val common = mutableMapOf<String, Any?>("name" to cleanName, "createdAt" to FieldValue.serverTimestamp())
        when (section) {
            HouseSection.SHOPPING -> common += mapOf(
                "addedBy" to addedBy,
                "done" to false,
                "urgent" to draft.urgent,
                "category" to (draft.category ?: classifyItem(cleanName)),
            )
            HouseSection.SMALL_PRIORITIES -> common += mapOf(
                "done" to false,
                "order" to System.currentTimeMillis(),
                "assignee" to draft.assignee,
                "category" to (draft.category ?: "🌸 Outros"),
                "notes" to draft.notes.orEmpty(),
                "price" to draft.price,
            ).filterValues { it != null }
            HouseSection.PROJECTS -> common += mapOf(
                "status" to "pendente",
                "order" to System.currentTimeMillis(),
                "notes" to draft.notes.orEmpty(),
                "budget" to (draft.budget ?: 0.0),
                "spent" to (draft.spent ?: 0.0),
                "category" to (draft.category ?: "🏠 Casa"),
                "subtasks" to emptyList<Map<String, Any?>>(),
            )
            HouseSection.HABITS -> common += mapOf(
                "emoji" to draft.emoji,
                "assignee" to draft.assignee,
                "streak" to 0,
                "reminderTime" to draft.reminderTime,
                "days" to draft.days,
            ).filterValues { it != null }
        }
        houseCollection(houseId, section.collection).add(common).await()
    }

    suspend fun updateItem(houseId: String, section: HouseSection, itemId: String, values: Map<String, Any?>) {
        val clean = values.mapValues { (_, value) -> value ?: FieldValue.delete() }
        houseCollection(houseId, section.collection).document(itemId).update(clean).await()
    }

    suspend fun moveItem(houseId: String, section: HouseSection, item: HouseItem, before: HouseItem) {
        require(section == HouseSection.SMALL_PRIORITIES || section == HouseSection.PROJECTS)
        val collection = houseCollection(houseId, section.collection)
        firestore.runBatch { batch ->
            batch.update(collection.document(item.id), "order", before.order)
            batch.update(collection.document(before.id), "order", item.order)
        }.await()
    }

    suspend fun addSubtask(houseId: String, project: HouseItem, name: String) {
        require(name.trim().isNotEmpty()) { "Escreve o nome da subtarefa." }
        val subtasks = project.subtasks + Subtask(
            id = System.currentTimeMillis().toString(),
            name = name.trim(),
            done = false,
        )
        updateItem(houseId, HouseSection.PROJECTS, project.id, mapOf("subtasks" to subtasks.map { it.asMap() }))
    }

    suspend fun toggleSubtask(houseId: String, project: HouseItem, subtask: Subtask) {
        val subtasks = project.subtasks.map { if (it.id == subtask.id) it.copy(done = !it.done) else it }
        updateItem(houseId, HouseSection.PROJECTS, project.id, mapOf("subtasks" to subtasks.map { it.asMap() }))
    }

    suspend fun deleteSubtask(houseId: String, project: HouseItem, subtaskId: String) {
        val subtasks = project.subtasks.filterNot { it.id == subtaskId }
        updateItem(houseId, HouseSection.PROJECTS, project.id, mapOf("subtasks" to subtasks.map { it.asMap() }))
    }

    suspend fun toggleItem(houseId: String, owner: String, section: HouseSection, item: HouseItem) {
        require(owner.isNotBlank()) { "Não foi possível identificar quem concluiu a atividade." }
        val document = houseCollection(houseId, section.collection).document(item.id)
        val activityDocument = firestore.collection("gamification").document(owner)
        val habitCheck = if (section == HouseSection.HABITS) {
            houseCollection(houseId, "habit_checks").document()
        } else {
            null
        }
        val today = today()

        firestore.runTransaction { transaction ->
            val storedItem = transaction.get(document)
            require(storedItem.exists()) { "A atividade já não existe." }

            val currentCompleted = when (section) {
                HouseSection.PROJECTS -> storedItem.getString("status") == "concluido"
                HouseSection.HABITS -> storedItem.getString("lastChecked") == today
                else -> storedItem.getBoolean("done") ?: false
            }
            val projectStatus = if (section == HouseSection.PROJECTS) {
                nextProjectStatus(storedItem.getString("status"))
            } else {
                null
            }
            val nextCompleted = when (section) {
                HouseSection.PROJECTS -> projectStatus == "concluido"
                HouseSection.HABITS -> true
                else -> !currentCompleted
            }
            val newHabitStreak = if (section == HouseSection.HABITS) {
                (storedItem.getLong("streak")?.toInt() ?: 0) + 1
            } else {
                0
            }

            if (isCompletionTransition(currentCompleted, nextCompleted)) {
                val currentActivity = transaction.get(activityDocument).activityStatsProfile()
                val updatedActivity = currentActivity.withCompletedActivity(section, newHabitStreak)
                transaction.set(
                    activityDocument,
                    updatedActivity.activityStatsAsFirestoreMap(section.completedAction()),
                    SetOptions.merge(),
                )
            }

            when (section) {
                HouseSection.SHOPPING, HouseSection.SMALL_PRIORITIES -> transaction.update(
                    document,
                    mapOf(
                        "done" to nextCompleted,
                        "completedAt" to if (nextCompleted) today else FieldValue.delete(),
                    ),
                )
                HouseSection.PROJECTS -> transaction.update(
                    document,
                    mapOf(
                        "status" to requireNotNull(projectStatus),
                        "completedAt" to if (nextCompleted) today else FieldValue.delete(),
                    ),
                )
                HouseSection.HABITS -> {
                    if (!currentCompleted) {
                        transaction.set(
                            requireNotNull(habitCheck),
                            mapOf(
                                "habitId" to item.id,
                                "date" to today,
                                "createdAt" to FieldValue.serverTimestamp(),
                            ),
                        )
                        transaction.update(
                            document,
                            mapOf("streak" to newHabitStreak, "lastChecked" to today),
                        )
                    }
                }
            }
        }.await()
    }

    suspend fun deleteItem(houseId: String, section: HouseSection, itemId: String) {
        houseCollection(houseId, section.collection).document(itemId).delete().await()
    }

    suspend fun addExpense(houseId: String, name: String, amount: Double, category: String, paidBy: String) {
        require(name.isNotBlank() && amount > 0) { "Indica uma descrição e um valor válido." }
        houseCollection(houseId, "expenses").add(
            mapOf(
                "name" to name.trim(), "amount" to amount, "category" to category,
                "paidBy" to paidBy, "date" to today(), "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
    }

    suspend fun addIncome(houseId: String, name: String, amount: Double, owner: String, recurring: Boolean) {
        require(name.isNotBlank() && amount > 0) { "Indica uma descrição e um valor válido." }
        houseCollection(houseId, "income").add(
            mapOf(
                "name" to name.trim(), "amount" to amount, "owner" to owner,
                "recurring" to recurring, "date" to today(), "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
    }

    suspend fun addSavingsGoal(houseId: String, name: String, emoji: String, target: Double) {
        require(name.isNotBlank() && target > 0) { "Indica um objetivo e um valor válido." }
        houseCollection(houseId, "savings_goals").add(
            mapOf(
                "name" to name.trim(), "emoji" to emoji, "targetAmount" to target,
                "currentAmount" to 0, "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
    }

    suspend fun depositSavings(houseId: String, goal: SavingsGoal, amount: Double) {
        require(amount > 0) { "Indica um valor válido." }
        houseCollection(houseId, "savings_goals").document(goal.id)
            .update("currentAmount", goal.currentAmount + amount).await()
    }

    suspend fun addEvent(houseId: String, title: String, date: String, guests: Int, creator: String) {
        require(title.isNotBlank()) { "Escreve o nome do evento." }
        houseCollection(houseId, "events").add(
            mapOf(
                "title" to title.trim(), "date" to date, "guests" to guests.coerceAtLeast(1),
                "participants" to listOf(creator), "done" to false, "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
    }

    suspend fun toggleEvent(houseId: String, event: CasaEvent) {
        houseCollection(houseId, "events").document(event.id).update("done", !event.done).await()
    }

    suspend fun updateEvent(houseId: String, eventId: String, values: Map<String, Any?>) {
        houseCollection(houseId, "events").document(eventId).update(values).await()
    }

    suspend fun addEventItem(houseId: String, eventId: String, name: String, type: String, assignee: String?) {
        require(name.trim().isNotEmpty()) { "Escreve o nome do item." }
        val values = mutableMapOf<String, Any>(
            "name" to name.trim(),
            "type" to if (type == "compra") "compra" else "todo",
            "done" to false,
            "createdAt" to FieldValue.serverTimestamp(),
        )
        if (!assignee.isNullOrBlank()) values["assignee"] = assignee
        houseCollection(houseId, "events").document(eventId).collection("items").add(values).await()
    }

    suspend fun updateEventItem(houseId: String, eventId: String, itemId: String, values: Map<String, Any?>) {
        houseCollection(houseId, "events").document(eventId).collection("items").document(itemId)
            .update(values).await()
    }

    suspend fun deleteEventItem(houseId: String, eventId: String, itemId: String) {
        houseCollection(houseId, "events").document(eventId).collection("items").document(itemId)
            .delete().await()
    }

    suspend fun cloneEvent(houseId: String, event: CasaEvent) {
        val eventCollection = houseCollection(houseId, "events")
        val clone = eventCollection.add(
            mapOf(
                "title" to "${event.title} (cópia)",
                "date" to "",
                "guests" to event.guests,
                "participants" to emptyList<String>(),
                "done" to false,
                "createdAt" to FieldValue.serverTimestamp(),
            ),
        ).await()
        val sourceItems = eventCollection.document(event.id).collection("items").get().await()
        if (!sourceItems.isEmpty) {
            val batch = firestore.batch()
            sourceItems.documents.forEach { source ->
                val target = clone.collection("items").document()
                batch.set(target, mapOf(
                    "name" to (source.getString("name") ?: "Item"),
                    "type" to (source.getString("type") ?: "todo"),
                    "done" to false,
                    "assignee" to source.getString("assignee"),
                    "createdAt" to FieldValue.serverTimestamp(),
                ).filterValues { it != null })
            }
            batch.commit().await()
        }
    }

    suspend fun createEventShare(houseId: String, event: CasaEvent, items: List<EventItem>): String {
        val alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
        val shareId = (1..12).map { alphabet.random() }.joinToString("")
        firestore.collection("event_shares").document(shareId).set(
            mapOf(
                "shareId" to shareId,
                "houseId" to houseId,
                "eventId" to event.id,
                "event" to mapOf(
                    "id" to event.id,
                    "title" to event.title,
                    "date" to event.date,
                    "guests" to event.guests,
                    "participants" to event.participants,
                    "items" to items.map { item ->
                        mapOf(
                            "name" to item.name,
                            "type" to item.type,
                            "done" to item.done,
                            "assignee" to item.assignee,
                        ).filterValues { it != null }
                    },
                ),
            ),
        ).await()
        return "https://casa-app-zeta.vercel.app/eventos/$shareId"
    }

    suspend fun deleteExtra(houseId: String, collection: String, id: String) {
        houseCollection(houseId, collection).document(id).delete().await()
    }

    suspend fun renameHouse(houseId: String, name: String) {
        require(name.trim().isNotEmpty() && name.trim().length <= 30) { "Escolhe um nome com até 30 caracteres." }
        firestore.collection("houses").document(houseId).update("name", name.trim()).await()
    }

    suspend fun updateProfile(profile: UserProfile, name: String, birthDate: String?) {
        val cleanName = name.trim()
        require(cleanName.isNotEmpty()) { "O nome não pode ficar vazio." }
        firestore.collection("users").document(profile.uid).update(
            mapOf("name" to cleanName, "birthDate" to birthDate),
        ).await()
        if (profile.houseId != null && cleanName != profile.name) {
            val houseRef = firestore.collection("houses").document(profile.houseId)
            val house = houseRef.get().await()
            @Suppress("UNCHECKED_CAST")
            val members = (house.get("members") as? List<Map<String, Any?>>).orEmpty().map { member ->
                if (member["uid"] == profile.uid) member + ("name" to cleanName) else member
            }
            houseRef.update("members", members).await()
        }
    }

    suspend fun createInvite(house: House, userId: String): String {
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        val code = (1..6).map { alphabet.random() }.joinToString("")
        val expires = Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000)
        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(expires)
        firestore.collection("invites").document(code).set(
            mapOf("houseId" to house.id, "houseName" to house.name, "createdBy" to userId, "expiresAt" to iso),
        ).await()
        return code
    }

    suspend fun getOrCreateFriendCode(houseId: String): String {
        val house = firestore.collection("houses").document(houseId)
        val existing = house.get().await().getString("friendCode")
        if (!existing.isNullOrBlank()) return existing
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        val code = (1..6).map { alphabet.random() }.joinToString("")
        house.update("friendCode", code).await()
        return code
    }

    suspend fun connectFriend(house: House, code: String) {
        val cleanCode = code.trim().uppercase()
        require(cleanCode.isNotBlank()) { "Escreve o código da casa amiga." }
        val result = firestore.collection("houses").whereEqualTo("friendCode", cleanCode).get().await()
        require(!result.isEmpty) { "Código de amizade inválido." }
        val friend = result.documents.first()
        require(friend.id != house.id) { "Esse é o código da tua própria casa." }
        val friendName = friend.getString("name") ?: "Casa"
        @Suppress("UNCHECKED_CAST")
        val friendMembers = (friend.get("members") as? List<Map<String, Any?>>).orEmpty().map {
            mapOf("name" to (it["name"] as? String ?: "Pessoa"))
        }
        val myMembers = house.members.map { mapOf("name" to it.name) }
        firestore.collection("houses").document(house.id).collection("friends").document(friend.id).set(
            mapOf("houseId" to friend.id, "houseName" to friendName, "members" to friendMembers, "connectedAt" to FieldValue.serverTimestamp()),
        ).await()
        firestore.collection("houses").document(friend.id).collection("friends").document(house.id).set(
            mapOf("houseId" to house.id, "houseName" to house.name, "members" to myMembers, "connectedAt" to FieldValue.serverTimestamp()),
        ).await()
    }

    suspend fun sendMessage(to: String, from: String, message: String) = withContext(Dispatchers.IO) {
        require(message.isNotBlank()) { "Escreve uma mensagem." }
        val token = auth.currentUser?.getIdToken(false)?.await()?.token
            ?: error("A sessão expirou. Entra novamente.")
        val connection = (URL(NOTIFICATION_ENDPOINT).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 10_000
            readTimeout = 10_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Authorization", "Bearer $token")
        }
        val body = JSONObject()
            .put("to", to.lowercase())
            .put("title", "💌 Mensagem de $from")
            .put("body", message.trim())
            .put("tag", "message")
            .toString()
        connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        require(connection.responseCode in 200..299) { "Não foi possível enviar a mensagem (${connection.responseCode})." }
        connection.disconnect()
    }

    suspend fun loadWeatherPreferences(userId: String): WeatherPreferences {
        val document = firestore.collection("users").document(userId).collection("preferences").document("weather").get().await()
        if (!document.exists()) return WeatherPreferences()
        val favorites = (document.get("favorites") as? List<*>)?.mapNotNull { raw ->
            val value = raw as? Map<*, *> ?: return@mapNotNull null
            weatherLocationFromMap(value)
        }.orEmpty().distinctBy { it.id }.take(10)
        val requestedDefault = document.getString("defaultFavoriteId")
        val mode = when {
            document.getString("defaultMode") == "current" -> "current"
            document.getString("defaultMode") == "favorite" && favorites.any { it.id == requestedDefault } -> "favorite"
            else -> "fallback"
        }
        return WeatherPreferences(mode, requestedDefault?.takeIf { mode == "favorite" }, favorites)
    }

    suspend fun saveWeatherPreferences(userId: String, preferences: WeatherPreferences) {
        firestore.collection("users").document(userId).collection("preferences").document("weather").set(
            mapOf(
                "defaultMode" to preferences.defaultMode,
                "defaultFavoriteId" to (preferences.defaultFavoriteId ?: FieldValue.delete()),
                "favorites" to preferences.favorites.map { it.asFirestoreMap() },
                "updatedAt" to FieldValue.serverTimestamp(),
            ),
            SetOptions.merge(),
        ).await()
    }

    suspend fun searchWeatherLocations(query: String): List<WeatherLocation> = withContext(Dispatchers.IO) {
        if (query.trim().length < 2) return@withContext emptyList()
        val encoded = URLEncoder.encode(query.trim(), Charsets.UTF_8.name())
        val json = JSONObject(URL("https://geocoding-api.open-meteo.com/v1/search?name=$encoded&count=8&language=pt&format=json").readText())
        val results = json.optJSONArray("results") ?: return@withContext emptyList()
        (0 until results.length()).mapNotNull { index ->
            val item = results.optJSONObject(index) ?: return@mapNotNull null
            val name = item.optString("name").trim()
            val latitude = item.optDouble("latitude", Double.NaN)
            val longitude = item.optDouble("longitude", Double.NaN)
            if (name.isBlank() || !latitude.isFinite() || !longitude.isFinite()) return@mapNotNull null
            val timezone = item.optString("timezone", "auto")
            val admin = item.optString("admin1").takeIf(String::isNotBlank)
            val country = item.optString("country").takeIf(String::isNotBlank)
            WeatherLocation(
                id = "%.4f,%.4f@%s".format(Locale.US, latitude, longitude, timezone),
                latitude = latitude,
                longitude = longitude,
                name = name,
                label = listOfNotNull(name, admin, country).joinToString(" · "),
                timezone = timezone,
                source = "geocoding",
                admin1 = admin,
                country = country,
                countryCode = item.optString("country_code").takeIf(String::isNotBlank)?.uppercase(),
            )
        }.distinctBy { it.id }
    }

    suspend fun loadBirthdays(house: House, friends: List<FriendHouse>): List<BirthdayEntry> {
        val results = mutableListOf<BirthdayEntry>()
        house.members.forEach { member ->
            val birthDate = runCatching {
                firestore.collection("users").document(member.uid).get().await().getString("birthDate")
            }.getOrNull()
            if (!birthDate.isNullOrBlank()) results += BirthdayEntry(member.name, birthDate)
        }
        friends.forEach { friend ->
            val friendHouse = runCatching { firestore.collection("houses").document(friend.houseId).get().await() }.getOrNull()
                ?: return@forEach
            val members = (friendHouse.get("members") as? List<*>)?.mapNotNull { raw -> raw as? Map<*, *> }.orEmpty()
            members.forEach { member ->
                val uid = member["uid"] as? String ?: return@forEach
                val name = member["name"] as? String ?: "Pessoa"
                val birthDate = runCatching {
                    firestore.collection("users").document(uid).get().await().getString("birthDate")
                }.getOrNull()
                if (!birthDate.isNullOrBlank()) results += BirthdayEntry(name, birthDate, friend.houseName)
            }
        }
        return results.distinctBy { "${it.houseName}:${it.name}:${it.birthDate}" }
    }

    suspend fun loadWeather(
        location: WeatherLocation = DefaultWeatherLocation,
        preferences: WeatherPreferences = WeatherPreferences(),
    ): WeatherState = withContext(Dispatchers.IO) {
        runCatching {
            val timezone = URLEncoder.encode(location.timezone.ifBlank { "auto" }, Charsets.UTF_8.name())
            val url = "https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&timezone=$timezone&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&forecast_days=7"
            val json = JSONObject(URL(url).readText())
            val current = json.getJSONObject("current")
            val daily = json.getJSONObject("daily")
            val times = daily.getJSONArray("time")
            val minimums = daily.getJSONArray("temperature_2m_min")
            val maximums = daily.getJSONArray("temperature_2m_max")
            val codes = daily.getJSONArray("weather_code")
            val rain = daily.getJSONArray("precipitation_probability_max")
            WeatherState(
                loading = false,
                activeLocation = location,
                preferences = preferences,
                temperature = current.getDouble("temperature_2m").roundToInt(),
                windSpeed = current.getDouble("wind_speed_10m").roundToInt(),
                weatherCode = current.getInt("weather_code"),
                days = (0 until times.length()).map { index ->
                    WeatherDay(
                        date = times.getString(index),
                        minimum = minimums.getDouble(index).roundToInt(),
                        maximum = maximums.getDouble(index).roundToInt(),
                        weatherCode = codes.getInt(index),
                        precipitationProbability = rain.optInt(index, 0),
                    )
                },
            )
        }.getOrElse { WeatherState(loading = false, activeLocation = location, preferences = preferences, error = "Não foi possível atualizar o tempo.") }
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
            birthDate = snapshot.getString("birthDate"),
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
            house = House(houseId, houseDocument.getString("name") ?: "Casa", members),
        )
    }

    private fun houseCollection(houseId: String, collection: String) =
        firestore.collection("houses").document(houseId).collection(collection)

    private fun avatarConfigFromMap(value: Map<*, *>): AvatarConfig = AvatarConfig(
        animal = (value["animal"] as? Number)?.toInt() ?: 0,
        eyes = (value["eyes"] as? Number)?.toInt() ?: 0,
        mouth = (value["mouth"] as? Number)?.toInt() ?: 0,
        top = (value["top"] as? Number)?.toInt() ?: 0,
        bottom = (value["bottom"] as? Number)?.toInt() ?: 0,
        accessory = (value["accessory"] as? Number)?.toInt() ?: 0,
        background = (value["background"] as? Number)?.toInt() ?: 0,
        effect = (value["effect"] as? Number)?.toInt() ?: 0,
    )

    private fun weatherLocationFromMap(value: Map<*, *>): WeatherLocation? {
        val id = value["id"] as? String ?: return null
        val name = value["name"] as? String ?: return null
        val latitude = (value["latitude"] as? Number)?.toDouble() ?: return null
        val longitude = (value["longitude"] as? Number)?.toDouble() ?: return null
        return WeatherLocation(
            id = id,
            latitude = latitude,
            longitude = longitude,
            name = name,
            label = value["label"] as? String ?: name,
            timezone = value["timezone"] as? String ?: "auto",
            source = value["source"] as? String ?: "geocoding",
            admin1 = value["admin1"] as? String,
            country = value["country"] as? String,
            countryCode = value["countryCode"] as? String,
        )
    }

    private fun WeatherLocation.asFirestoreMap(): Map<String, Any> = mapOf(
        "id" to id,
        "latitude" to latitude,
        "longitude" to longitude,
        "name" to name,
        "label" to label,
        "timezone" to timezone,
        "source" to source,
        "isFallback" to (source == "fallback"),
    ) + listOfNotNull(
        admin1?.let { "admin1" to it },
        country?.let { "country" to it },
        countryCode?.let { "countryCode" to it },
    ).toMap()

    private fun DocumentSnapshot.number(field: String): Double? = (get(field) as? Number)?.toDouble()

    private fun DocumentSnapshot.activityStatsProfile(): GamificationProfile = GamificationProfile(
        totalCompleted = getLong("totalCompleted")?.toInt() ?: 0,
        maxStreak = getLong("maxStreak")?.toInt() ?: 0,
        shoppingDone = getLong("shoppingDone")?.toInt() ?: 0,
        coisinhasDone = getLong("coisinhasDone")?.toInt() ?: 0,
        projectsDone = getLong("projectsDone")?.toInt() ?: 0,
        habitsDone = getLong("habitsDone")?.toInt() ?: 0,
    )

    private fun Subtask.asMap(): Map<String, Any> = mapOf("id" to id, "name" to name, "done" to done)

    companion object {
        private const val WEB_CLIENT_ID =
            "776757654663-4j0u4nelqulc5v28asuq972ots5cd8a8.apps.googleusercontent.com"
        private const val NOTIFICATION_ENDPOINT = "https://casa-app-zeta.vercel.app/api/send-notification"
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

        private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

        private fun classifyItem(name: String): String {
            val value = name.lowercase()
            return when {
                listOf("leite", "queijo", "iogurte", "manteiga", "ovos").any(value::contains) -> "🥛 Laticínios & Ovos"
                listOf("maçã", "banana", "laranja", "tomate", "alface", "batata", "fruta", "legumes").any(value::contains) -> "🥬 Fruta & Legumes"
                listOf("carne", "frango", "peixe", "bacalhau", "fiambre").any(value::contains) -> "🥩 Carne & Peixe"
                listOf("pão", "arroz", "massa", "farinha", "cereais").any(value::contains) -> "🍞 Despensa"
                listOf("detergente", "lixívia", "esponja", "sacos", "limpeza").any(value::contains) -> "🧹 Limpeza"
                listOf("champô", "shampoo", "gel", "pasta", "papel higiénico").any(value::contains) -> "🛁 Higiene"
                else -> "🌸 Outros"
            }
        }
    }
}
