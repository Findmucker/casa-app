package com.findmucker.casa

data class WeatherLocation(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val name: String,
    val label: String,
    val timezone: String,
    val source: String,
    val admin1: String? = null,
    val country: String? = null,
    val countryCode: String? = null,
)

val DefaultWeatherLocation = WeatherLocation(
    id = "fallback-obidos-pt",
    latitude = 39.36,
    longitude = -9.16,
    name = "Óbidos",
    label = "Óbidos",
    timezone = "Europe/Lisbon",
    source = "fallback",
    admin1 = "Leiria",
    country = "Portugal",
    countryCode = "PT",
)

data class WeatherPreferences(
    val defaultMode: String = "fallback",
    val defaultFavoriteId: String? = null,
    val favorites: List<WeatherLocation> = emptyList(),
) {
    fun resolvedLocation(): WeatherLocation =
        if (defaultMode == "favorite") favorites.firstOrNull { it.id == defaultFavoriteId } ?: DefaultWeatherLocation
        else DefaultWeatherLocation

    fun withFavorite(location: WeatherLocation): WeatherPreferences = when {
        location.source != "geocoding" -> this
        favorites.any { it.id == location.id } -> this
        favorites.size >= 10 -> this
        else -> copy(favorites = favorites + location)
    }

    fun withoutFavorite(id: String): WeatherPreferences {
        val next = favorites.filterNot { it.id == id }
        return if (defaultMode == "favorite" && defaultFavoriteId == id) {
            copy(defaultMode = "fallback", defaultFavoriteId = null, favorites = next)
        } else copy(favorites = next)
    }
}

data class BirthdayEntry(
    val name: String,
    val birthDate: String,
    val houseName: String? = null,
)
