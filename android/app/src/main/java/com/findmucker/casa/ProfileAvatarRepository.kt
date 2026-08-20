package com.findmucker.casa

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

data class AnimalAvatar(val emoji: String, val label: String)

val BasicAnimalAvatars = listOf(
    AnimalAvatar("🐼", "Panda"),
    AnimalAvatar("🐱", "Gatinho"),
    AnimalAvatar("🐰", "Coelhinho"),
    AnimalAvatar("🦊", "Raposa"),
    AnimalAvatar("🐻", "Ursinho"),
    AnimalAvatar("🐶", "Cãozinho"),
    AnimalAvatar("🐧", "Pinguim"),
    AnimalAvatar("🐹", "Hamster"),
    AnimalAvatar("🐨", "Coala"),
    AnimalAvatar("🦉", "Coruja"),
    AnimalAvatar("🐸", "Sapinho"),
)

const val DefaultAvatarEmoji = "🐼"

fun isSupportedAvatar(emoji: String): Boolean = BasicAnimalAvatars.any { it.emoji == emoji }

class ProfileAvatarRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
) {
    suspend fun migrateLegacyAvatarIfNeeded(profile: UserProfile, house: House): String {
        if (isSupportedAvatar(profile.avatar)) return profile.avatar

        val legacyDocument = firestore.collection("gamification").document(profile.name).get().await()
        val legacyAvatar = legacyDocument.get("avatar") as? Map<*, *>
        val animalIndex = (legacyAvatar?.get("animal") as? Number)?.toInt()
        val migratedAvatar = animalIndex
            ?.let(BasicAnimalAvatars::getOrNull)
            ?.emoji
            ?: DefaultAvatarEmoji

        saveAvatar(profile, house, migratedAvatar)
        return migratedAvatar
    }

    suspend fun saveAvatar(profile: UserProfile, house: House, avatar: String) {
        require(isSupportedAvatar(avatar)) { "Escolhe um animal válido." }

        val userRef = firestore.collection("users").document(profile.uid)
        val houseRef = firestore.collection("houses").document(house.id)

        firestore.runTransaction { transaction ->
            val houseDocument = transaction.get(houseRef)
            val rawMembers = houseDocument.get("members") as? List<*>
                ?: error("A casa não tem uma lista de membros válida.")

            val members = rawMembers.mapNotNull { rawMember ->
                val source = rawMember as? Map<*, *> ?: return@mapNotNull null
                source.entries
                    .associate { (key, value) -> key.toString() to value }
                    .toMutableMap()
                    .apply {
                        if (this["uid"] == profile.uid) this["avatar"] = avatar
                    }
                    .toMap()
            }

            require(members.size == rawMembers.size) {
                "Não foi possível atualizar os membros da casa com segurança."
            }

            transaction.update(userRef, "avatar", avatar)
            transaction.update(houseRef, "members", members)
        }.await()
    }
}
