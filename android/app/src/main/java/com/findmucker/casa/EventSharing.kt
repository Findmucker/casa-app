package com.findmucker.casa

internal fun buildEventShareText(event: CasaEvent, items: List<EventItem>): String = buildString {
    append("🎉 ")
    append(event.title)

    if (event.date.isNotBlank()) {
        append("\n📅 ")
        append(event.date)
    }
    if (event.participants.isNotEmpty()) {
        append("\n👥 ")
        append(event.participants.joinToString(", "))
    }
    if (items.isNotEmpty()) {
        items.forEach { item ->
            append("\n")
            append(if (item.done) "✅" else "⬜")
            append(" ")
            append(item.name)
            item.assignee?.takeIf(String::isNotBlank)?.let { assignee ->
                append(" — ")
                append(assignee)
            }
        }
    }

    append("\n\nPartilhado pela app A Nossa Casinha")
}
