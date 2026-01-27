
# Plan implementacji zmian z dokumentu testowego

## Podsumowanie
Na podstawie dokumentu z poprawkami zaimplementuję następujące zmiany w 7 obszarach aplikacji:

---

## 1. Strona główna (Index) - Tekst powitalny

**Plik:** `src/pages/Index.tsx` (linie 389-401)

**Obecny stan:**
```
Znajdź wykonawcę w kilka minut
Portal pracy krótkoterminowej. Dodaj zlecenie, wybierz wykonawcę, załatw sprawę. Prosto, szybko, lokalnie.
```

**Zmiana na:**
```
Portal zleceń krótkoterminowych.
Dodaj zlecenie, wybierz wykonawcę, załatw sprawę.
Prosto, szybko, lokalnie.
```

- Zmiana tekstu z "Portal pracy krótkoterminowej" na "Portal zleceń krótkoterminowych"
- Tekst powitalny w 3 wyśrodkowanych wierszach
- Zmiana tytułu głównego dla większej czytelności

---

## 2. Menu/Nawigacja (Header) - Ujednolicenie nazewnictwa

**Plik:** `src/components/layout/Header.tsx`

### Zmiany:
1. **Linia ~216**: Zmiana "Panel" na nieklikalny nagłówek "Panel użytkownika"
2. **Linie ~228-240**: Zmiana "Zleceniodawca" na "Panel zleceniodawcy" i "Wykonawca" na "Panel wykonawcy"
3. Dodanie wcięcia wizualnego (padding-left) dla elementów podmenu
4. Element nadrzędny "Panel użytkownika" stanie się etykietą-nagłówkiem (bez onClick)

**Struktura menu po zmianach:**
```
Panel użytkownika (nagłówek - nieklikalny)
  ├── Panel zleceniodawcy (klikalny)
  └── Panel wykonawcy (klikalny)
```

---

## 3. Dodawanie zlecenia (NewJob) - Pole ulicy i data

**Plik:** `src/pages/NewJob.tsx`

### 3a. Zmiana etykiety pola ulicy (linie 967-978)
**Było:** "Ulica i numer (opcjonalnie)"  
**Będzie:** "Ulica *" (pole wymagane)

Dodanie informacji o prywatności:
```
Nazwa ulicy nie będzie widoczna dla innych użytkowników.
Jedynie służy umieszczeniu ogłoszenia we właściwej okolicy na mapie.
```

### 3b. Usunięcie pola "Data i godzina zakończenia" (linie 1057-1064)
Całkowite usunięcie tego pola - wystarczy jedna data (rozpoczęcia lub "Do ustalenia")

### 3c. Zmiana tytułu kroku 4 (linie 1183-1186)
**Było:** "Podsumowanie i płatność" / "Sprawdź dane i opłać publikację"  
**Będzie:** "Podsumowanie" / "Sprawdź dane przed publikacją"

### 3d. Dodanie opcji "Zlecenie pilne" (nowy element)
Dodanie przełącznika "Zlecenie pilne" do formularza NewJob (krok 1 lub 3), analogicznie do EditJob:
```tsx
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label>Zlecenie pilne</Label>
    <p className="text-xs text-muted-foreground">Start dziś lub jutro</p>
  </div>
  <Switch
    checked={form.urgent}
    onCheckedChange={(v) => updateForm('urgent', v)}
  />
</div>
```

---

## 4. Edycja zlecenia (EditJob) - Usunięcie przełącznika lokalizacji

**Plik:** `src/pages/EditJob.tsx` (linie 287-294)

Usunięcie komponentu `LocationTypeToggle` (przełącznik Polska/Zagranica).
Zgodnie z wymaganiami projektu, wszystkie zlecenia są ograniczone do województwa dolnośląskiego.

**Usunięcie:**
- Import `LocationTypeToggle` (linia 28)
- Sekcja z przełącznikiem (linie 287-294)
- Pola `is_foreign` i `country` z formularza

---

## 5. Profil użytkownika (Profile) - Zmiana tytułu i logo

**Plik:** `src/pages/Profile.tsx`

### 5a. Zmiana tytułu (linia 487)
**Było:** "Mój profil"  
**Będzie:** "Profil użytkownika"

### 5b. Przeniesienie sekcji "Logo firmy"
Logo firmy powinno być widoczne tylko dla użytkowników z ukończonym profilem wykonawcy (workerProfileCompleted === true).

Zmiana warunku renderowania sekcji "Logo firmy" (linie 575-660):
```tsx
{workerProfileCompleted && (
  <Card className="mb-6">
    {/* Logo firmy content */}
  </Card>
)}
```

---

## 6. Mapa pracy (WorkMapLeaflet) - Usunięcie efektu pulsowania

**Plik:** `src/components/workmap/WorkMapLeaflet.tsx`

### 6a. Usunięcie pulsowania z markerów (linia 133)
**Usunięcie linii:**
```tsx
${urgent ? '<div class="job-pulse" style="background: #ef4444;"></div>' : ''}
```

### 6b. Usunięcie stylów CSS dla `.job-pulse` (linie 806-816)
Usunięcie definicji CSS dla efektu pulsowania pojedynczych markerów.

**Uwaga:** Pulsowanie klastrów pozostaje bez zmian (cluster-pulse), usuwamy tylko pulsowanie pojedynczych markerów.

---

## 7. Autouzupełnianie miast (CityAutocomplete) - Poprawa sugestii

**Plik:** `src/components/jobs/CityAutocomplete.tsx`

### 7a. Wcześniejsze podpowiedzi (linia 39)
Zmiana minimalnej liczby znaków do wyszukiwania z 2 na 2 (już jest 2, OK)

### 7b. Dodanie województwa do wyświetlania (już zaimplementowane)
Komponent już wyświetla region (województwo) pod nazwą miasta.

### 7c. Usunięcie filtrowania "starts with" (linie 87-89)
Obecnie sugestie są filtrowane tylko do miast zaczynających się od wpisanego tekstu.
Zmiana na wyszukiwanie zawierające (contains) dla lepszych wyników:

**Było:**
```tsx
.filter((item: CitySuggestion) =>
  item.name.toLowerCase().startsWith(query.toLowerCase())
)
```

**Będzie:**
```tsx
.filter((item: CitySuggestion) =>
  item.name.toLowerCase().includes(query.toLowerCase())
)
```

---

## Podsumowanie plików do edycji

| Plik | Typ zmian |
|------|-----------|
| `src/pages/Index.tsx` | Tekst hero |
| `src/components/layout/Header.tsx` | Menu dropdown |
| `src/pages/NewJob.tsx` | Pole ulicy, usunięcie daty końcowej, tytuł kroku 4, dodanie "Pilne" |
| `src/pages/EditJob.tsx` | Usunięcie przełącznika lokalizacji |
| `src/pages/Profile.tsx` | Tytuł, warunek logo |
| `src/components/workmap/WorkMapLeaflet.tsx` | Usunięcie pulsowania |
| `src/components/jobs/CityAutocomplete.tsx` | Poprawa wyszukiwania |

---

## Szczegóły techniczne

### Kolejność implementacji
1. Proste zmiany tekstowe (Index, Profile tytuł)
2. Zmiany w formularzach (NewJob, EditJob)
3. Menu/nawigacja (Header)
4. Mapa i lokalizacje (WorkMapLeaflet, CityAutocomplete)

### Walidacja po zmianach
- Pole "Ulica" stanie się wymagane - należy zaktualizować `validateStep(2)` w NewJob.tsx
- Usunięcie `end_time` z formularza i handleSubmit w NewJob.tsx
- Test tworzenia i edycji zleceń po zmianach
