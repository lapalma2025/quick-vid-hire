

# Plan: Przyspieszenie wyszukiwania miast i ulic

## Cel
Skrócenie czasu oczekiwania na podpowiedzi w autouzupełnianiu miast i ulic z obecnych ~500-800ms do ~150-300ms.

## Zidentyfikowane problemy

| Problem | Obecny stan | Wpływ na wydajność |
|---------|-------------|-------------------|
| Debounce | 250-350ms | Opóźnienie przed wysłaniem zapytania |
| Równoległe API | 2-3 API (Photon + Nominatim) | Czekanie na najwolniejsze |
| Brak cache | Brak | Powtarzanie zapytań |
| MIN_CHARS | 3 znaki | Dłuższe wpisywanie |

## Proponowane optymalizacje

### 1. Zmniejszenie czasu debounce
- CityAutocomplete: 250ms -> 150ms
- StreetAutocomplete: 250ms -> 150ms  
- LocationAutocomplete: 350ms -> 150ms

### 2. Strategia "first-response-wins" dla API
Zamiast czekać na wszystkie odpowiedzi z Promise.allSettled(), pokażemy wyniki z pierwszego API które odpowie, a następnie wzbogacimy je o pozostałe.

### 3. Cache wyników w pamięci
Prosty cache (Map) przechowujący ostatnie 50 zapytań, aby uniknąć ponownych wywołań API dla tych samych fraz.

### 4. Optymalizacja MIN_CHARS
- Zmniejszenie do 2 znaków dla miast
- Pozostawienie 3 znaków dla ulic (potrzebna większa precyzja)

## Szczegóły techniczne

### Zmiany w CityAutocomplete.tsx

```text
Linia 21:  MIN_CHARS = 3 -> 2
Linia 276: setTimeout(..., 250) -> 150

Nowa logika fetchSuggestions:
- Dodanie cache na poziomie komponentu
- Race condition: pokazanie wyników z pierwszego API
- Asynchroniczne dodawanie wyników z pozostałych API
```

### Zmiany w StreetAutocomplete.tsx

```text
Linia 22:  MIN_CHARS = 3 (bez zmian - ulice wymagają precyzji)
Linia 296: setTimeout(..., 250) -> 150

Nowa logika fetchSuggestions:
- Dodanie cache na poziomie komponentu
- Priorytetyzacja Photon API (szybsze)
- Nominatim jako fallback tylko gdy Photon nie zwróci wyników
```

### Zmiany w LocationAutocomplete.tsx

```text
Linia 98:  setTimeout(..., 350) -> 150
```

### Nowy hook: useCachedSearch

Wydzielenie logiki cache do wspólnego hooka:

```typescript
const useSearchCache = (maxSize = 50) => {
  const cacheRef = useRef(new Map());
  
  const get = (key: string) => cacheRef.current.get(key);
  const set = (key: string, value: any) => {
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    cacheRef.current.set(key, value);
  };
  
  return { get, set };
};
```

## Oczekiwane rezultaty

| Metryka | Przed | Po |
|---------|-------|-----|
| Czas do pierwszych wyników | 500-800ms | 150-300ms |
| Powtórne zapytania | 500-800ms | ~0ms (cache) |
| Minimalna liczba znaków (miasta) | 3 | 2 |

## Pliki do modyfikacji

1. `src/components/jobs/CityAutocomplete.tsx`
2. `src/components/jobs/StreetAutocomplete.tsx`
3. `src/components/workmap/LocationAutocomplete.tsx`
4. Nowy: `src/hooks/useSearchCache.ts`

