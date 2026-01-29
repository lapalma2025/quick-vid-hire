

# Plan usunięcia zleceń bez lokalizacji

## Problem

Znaleziono **14 aktywnych zleceń** we Wrocławiu, które nie mają podanej dzielnicy ani współrzędnych. Są to stare zlecenia testowe utworzone przed wprowadzeniem wymogu lokalizacji. Powodują problem z nakładającymi się znacznikami na mapie.

## Rozwiązanie

Usunięcie tych zleceń z bazy danych, ponieważ:
- Są to zlecenia testowe (nazwy typu "Test...", "User Testowy")
- Nie mają prawidłowej lokalizacji
- Nowe zlecenia wymagają dzielnicy lub ulicy, więc problem nie powtórzy się

---

## Lista zleceń do usunięcia (14 rekordów)

| Tytuł | ID |
|-------|-----|
| Test2 zgloszenie | 89e0e250-81e9-4201-b16a-f0e6e3e719f0 |
| Test4 | e2760cf0-08c2-4518-834a-7e454ce6c86f |
| Test aplikacja | b5129596-e97d-4475-bbbc-2cec3df54d69 |
| Testowe zlecenie Pro | e89807bc-05ad-4a20-b3db-e1d9478569b6 |
| Test pro 6 | fa0df91f-2f7e-412c-9399-7e6f1af9f73a |
| Test pro user | 86464168-ca8e-458e-b738-2e4f297aa64b |
| User Testowy | 00c8e343-b179-4797-8e7a-63461f0a9c1c |
| User pro 2 | dd4c8e30-5ced-420e-98fa-45532d9a250d |
| Test pro4 | d718e3df-b8af-431e-b443-1c8bac54608f |
| Test pro | 7a9bd3bb-bc7a-41f7-81b3-165dbf14b7db |
| Test Boost | 8e678cde-8c2e-4ca3-ad4b-5507730f6688 |
| Test Pro | 5a760eb6-25af-4ff8-b8a6-9cf05923f077 |
| Zgłoszenie grupowe | aa5615df-c9a4-4c16-872d-70d01c807f49 |
| Praca w Berlinie - sprzątanie | f734fcd3-18d9-4650-8121-6d1d3cd07132 |

---

## Szczegóły techniczne

### Zapytanie SQL do wykonania

```sql
DELETE FROM jobs 
WHERE miasto = 'Wrocław' 
  AND status = 'active'
  AND (district IS NULL OR district = '')
  AND location_lat IS NULL;
```

### Uwaga o powiązanych danych

Przed usunięciem zleceń sprawdzę, czy istnieją powiązane rekordy (np. odpowiedzi na zlecenia, wiadomości), które również trzeba będzie usunąć lub które mogą blokować usunięcie.

