package com.findmucker.casa

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

val BasicAnimalAvatars = listOf(
    "🐼" to "Panda",
    "🐱" to "Gatinho",
    "🐰" to "Coelhinho",
    "🦊" to "Raposa",
    "🐻" to "Ursinho",
    "🐶" to "Cãozinho",
    "🐧" to "Pinguim",
    "🐹" to "Hamster",
    "🐨" to "Coala",
    "🦉" to "Coruja",
    "🐸" to "Sapinho",
)

class ProfileAvatarRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    suspend fun migrateLegacyAvatarIfNeeded(profile: UserProfile, house: House): String {
        val current = profile.avatar.takeIf { value -> BasicAnimalAvatars.any { it.first == value } }
        if (current != null) return current

        val legacy = firestore.collection("gamification").document(profile.name).get().await()
        val avatarMap = legacy.get("avatar") as? Map<*, *>
        val animalIndex = (avatarMap?.get("animal") as? Number)?.toInt()
        val migrated = animalIndex?.let { BasicAnimalAvatars.getOrNull(it)?.first } ?: BasicAnimalAvatars.first().first

        saveAvatar(profile, house, migrated)
        return migrated
    }

    suspend fun saveAvatar(profile: UserProfile, house: House, avatar: String) {
        require(BasicAnimalAvatars.any { it.first == avatar }) { "Escolhe um animal válido." }
        val userRef = firestore.collection("users").document(profile.uid)
        val houseRef = firestore.collection("houses").document(house.id)

        firestore.runTransaction { transaction ->
            val document = transaction.get(houseRef)
            val rawMembers = document.get("members") as? List<*>
                ?: error("A casa não tem uma lista de membros válida.")
            val members = rawMembers.mapNotNull { raw ->
                val source = raw as? Map<*, *> ?: return@mapNotNull null
                val member = source.entries.associate { (key, value) -> key.toString() to value }.toMutableMap()
                if (member["uid"] == profile.uid) member["avatar"] = avatar
                member.toMap()
            }
            require(members.size == rawMembers.size) { "Não foi possível atualizar os membros da casa com segurança." }
            transaction.update(userRef, "avatar", avatar)
            transaction.update(houseRef, "members", members)
        }.await()
    }
}
