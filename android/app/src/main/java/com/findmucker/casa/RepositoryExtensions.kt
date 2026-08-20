package com.findmucker.casa

@Suppress("UNUSED_PARAMETER")
suspend fun FirebaseCasaRepository.toggleItem(
    houseId: String,
    actorName: String,
    section: HouseSection,
    item: HouseItem,
) = toggleItem(houseId, section, item)
