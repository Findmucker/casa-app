# Fix: Página de equipamento e sincronização com avatar (#95)

## Contexto
Existem 2 sistemas de avatar:
1. **AnimeAnimalCharacter** (`AvatarConfig`) — avatar animal com roupa integrada (top/bottom/accessory como índices de estilo)
2. **CharacterModel** (`EquippedItems`) — boneco RPG com loot equipado (helmet/weapon/shield/armor/boots/accessory como item IDs)

O CharacterModel só aparece no ProfilePage (header e tab inventário). O resto da app (widget membros, HouseMembers, MiniAvatar) usa AnimeAnimalCharacter. O equipamento RPG não é visível em lado nenhum fora do perfil próprio.

## Problemas Identificados
1. EquippedItems não é mostrado nos avatares de membros em lado nenhum
2. Quando se vê o perfil de outro membro (`viewMember`), não carrega o `equipped` deles
3. Não há sync real-time do equipamento (usa `getDoc` one-shot)
4. O `CharacterModel` devia ter uma representação mini para mostrar junto ao AnimeAnimalCharacter

## Solução

### Abordagem: Mostrar loot equipped como badges/overlay no avatar

Em vez de substituir o AnimeAnimalCharacter pelo CharacterModel (são sistemas visuais diferentes), vou:

1. **Adicionar overlay de equipamento ao MiniAvatar e avatar no widget** — mostrar emojis do loot equipado como pequenos badges ao redor do avatar
2. **Fix viewMember no ProfilePage** — carregar `equipped` e `inventory` do membro visualizado
3. **Adicionar `equipped` ao dados carregados no widget de membros** — para poder mostrar badges

### Ficheiros a modificar

| Ficheiro | Alteração |
|---|---|
| `components/MiniAvatar.tsx` | Carregar `equipped` do Firestore, mostrar badge de helmet/weapon como overlay |
| `components/ProfilePage.tsx` | Fix: quando `viewMember`, carregar o equipped/inventory desse membro |
| `app/dashboard/DashboardClient.tsx` | Adicionar `equipped` ao `MemberWidget`, mostrar badge no widget |
| `components/HouseMembers.tsx` | Mostrar equipped badges nos cards de membros |

### Implementação

#### 1. MiniAvatar — overlay de equipamento
```tsx
// Carregar equipped junto com avatar
const equipped = snap.data()?.equipped || {};
// Mostrar badge do helmet (se existir) como pequeno emoji no canto superior
```

#### 2. ProfilePage viewMember fix
```tsx
// Quando viewMember é definido, usar viewMember como owner para carregar tudo
const owner = viewMember || user?.displayName || user?.email || "user";
// Já está parcialmente feito, verificar que equipped carrega corretamente
```

#### 3. Widget de membros — equipped badges
```tsx
interface MemberWidget {
  // ... existing fields
  equipped?: EquippedItems;
}
// Mostrar helmet emoji como badge no avatar do widget
```

#### 4. HouseMembers — equipped no card
Mostrar emojis do equipamento principal (helmet + weapon) como mini-badges.

## Verificação
- `npx tsc --noEmit` passa
- MiniAvatar mostra badge de equipamento quando o membro tem loot equipped
- Widget de membros mostra badges de equipamento
- Ver perfil de outro membro mostra o CharacterModel com o equipped deles
- Equipar/desequipar no próprio perfil reflete após refresh nos outros locais
