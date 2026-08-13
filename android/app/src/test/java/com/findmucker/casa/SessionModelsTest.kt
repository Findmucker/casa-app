package com.findmucker.casa

import org.junit.Assert.assertEquals
import org.junit.Test

class SessionModelsTest {
    @Test
    fun `project status cycles through every native state`() {
        assertEquals("em progresso", nextProjectStatus("pendente"))
        assertEquals("concluido", nextProjectStatus("em progresso"))
        assertEquals("pendente", nextProjectStatus("concluido"))
    }

    @Test
    fun `dashboard replaces only the updated collection`() {
        val shopping = listOf(HouseItem(id = "one", name = "Leite", done = false))
        val dashboard = DashboardState().withItems(HouseSection.SHOPPING, shopping)

        assertEquals(shopping, dashboard.forSection(HouseSection.SHOPPING))
        assertEquals(emptyList<HouseItem>(), dashboard.forSection(HouseSection.HABITS))
        assertEquals(false, HouseSection.SHOPPING in dashboard.loading)
        assertEquals(true, HouseSection.HABITS in dashboard.loading)
    }

    @Test
    fun `native navigation matches the nine web tabs in order`() {
        assertEquals(
            listOf(
                "Início",
                "Compras",
                "Coisinhas",
                "Projetos",
                "Rotinas",
                "Finanças",
                "Calendário",
                "Eventos",
                "Tempo",
            ),
            DashboardTab.entries.map { it.label },
        )
    }

    @Test
    fun `level progression matches the web profile`() {
        assertEquals(1, levelForPoints(0))
        assertEquals(1, levelForPoints(49))
        assertEquals(2, levelForPoints(50))
        assertEquals(11, levelForPoints(500))
    }
}
