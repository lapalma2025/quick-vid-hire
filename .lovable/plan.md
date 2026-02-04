
# Plan: Elegancki Jasny Styl dla Obu Map

## Cel
Zmiana stylu kafelków mapowych na obu mapach (Mapa Pracy i Mapa Wykonawców) na jednolity, jasny i elegancki wygląd.

## Proponowany styl

**CARTO Positron** - minimalistyczny, jasny design:
- Kremowo-białe tło
- Delikatne szare linie ulic
- Subtelne kontury budynków
- Elegancki, nowoczesny wygląd

URL: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`

## Porównanie stylów

| Cecha | Obecny (Voyager) | Nowy (Positron) |
|-------|------------------|-----------------|
| Tło | Kremowe z kolorami | Białe/jasnoszare |
| Ulice | Kolorowe, wyraźne | Subtelne, szare |
| Budynki | Kolorowe wypełnienie | Minimalne kontury |
| Tereny zielone | Zielone | Bardzo jasne szare |
| Woda | Niebieska | Jasnoniebieska |
| Ogólny styl | Szczegółowy, kolorowy | Minimalistyczny, elegancki |

## Zmiany techniczne

### 1. WorkMapLeaflet.tsx (linia 539)

```typescript
// Zmiana z:
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", ...)

// Na:
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", ...)
```

### 2. WorkersMap.tsx (linia 232)

```typescript
// Zmiana z:
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', ...)

// Na:
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', ...)
```

## Efekt wizualny

- Czyste, białe tło mapy
- Minimalistyczne szare linie ulic
- Znaczniki zleceń (fioletowe/czerwone) i wykonawców (zielone) będą mocno kontrastować
- Profesjonalny, nowoczesny wygląd podobny do Apple Maps

## Bezpieczeństwo zmian

- Zmiana dotyczy tylko URL kafelków mapy (1 linia w każdym pliku)
- Żadna logika nie jest modyfikowana
- Wszystkie funkcjonalności pozostają bez zmian
- Styl CARTO Positron jest darmowy i nie wymaga klucza API
