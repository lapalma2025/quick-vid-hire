

# Zmiana: Usunięcie dzielnic na rzecz ulic

## Co zostało zrobione

### 1. Usunięto wybór dzielnic z formularza dodawania zlecenia
- **src/pages/NewJob.tsx**: Usunięto sekcję wyboru dzielnicy dla Wrocławia
- Walidacja nie wymaga już dzielnicy - wymagana jest tylko ulica
- Usunięto nieużywany import `WROCLAW_DISTRICTS`

### 2. Zaktualizowano logikę mapy
- **src/hooks/useVehicleData.ts**: Zlecenia BEZ współrzędnych (location_lat/lng) nie są pokazywane na mapie
- Tylko zlecenia z precyzyjnymi współrzędnymi z geokodowania ulicy są widoczne
- Usunięto fallback do centroid dzielnicy lub centrum miasta

### 3. Usunięto zlecenia bez lokalizacji z bazy danych
- Usunięto 14 testowych zleceń z Wrocławia bez dzielnicy/ulicy
- Usunięto 1 zlecenie z dzielnicą ale bez współrzędnych

## Efekt
- Wszystkie zlecenia na mapie mają teraz precyzyjną lokalizację (ulica)
- Nie ma już nakładających się znaczników w centrum miasta/dzielnicy
- Nowe zlecenia wymagają podania ulicy, co gwarantuje poprawną geolokalizację
