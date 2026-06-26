# WordPress Credential Security Design — DCA OS Lite

**Status:** Dokument projektowy (tylko dokumentacja — bez implementacji)  
**Data:** 2026-06-26  
**Zakres:** Jak bezpiecznie przechowywać i używać credentiale WordPress, zanim włączymy realne publikowanie  
**Odbiorca:** Właściciel produktu, operatorzy, przyszli implementatorzy  

**Powiązane dokumenty:**

- [`docs/ai-delivery/WORDPRESS_CREDENTIAL_POLICY_DECISION.md`](../ai-delivery/WORDPRESS_CREDENTIAL_POLICY_DECISION.md) — aktualna decyzja STOP
- [`docs/ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md`](../ai-delivery/WORDPRESS_PREPARED_DRAFT_FOUNDATION.md) — przygotowanie draftu lokalnie
- [`docs/ai-delivery/WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md`](../ai-delivery/WORDPRESS_MOCK_PUBLICATION_FOUNDATION.md) — mock publikacji i konfiguracja bez sekretów
- [`prd.md.txt`](../../prd.md.txt) — PRD produktu (sekcje 4.2, 5.2, 12.2, 13)

---

## Cel tego dokumentu

Ten dokument opisuje **jak** DCA OS Lite powinien obsługiwać hasła i tokeny WordPress — **zanim** ktokolwiek napisze kod, który zapisuje sekrety lub dzwoni do WordPressa na żywo.

Nie jest to implementacja. To plan bezpieczeństwa do zatwierdzenia przez właściciela produktu.

---

## 1. Co jest dziś (stan foundation)

### Co już działa — bezpiecznie, bez credentiali

| Obszar | Co robi | Czy używa sekretów WordPress? |
|--------|---------|-------------------------------|
| **Konfiguracja strony (Company Profile)** | Zapisuje URL strony, slug, flagę WordPress.com | **Nie** — tylko dane publiczne |
| **Przygotowanie draftu (AI Delivery)** | Buduje lokalny JSON gotowy do publikacji | **Nie** — zero połączeń z WordPressem |
| **Test publikacji (mock)** | Zwraca status `provider_disabled` | **Nie** — zero zewnętrznych wywołań |
| **Serwis WordPress (scaffold)** | Typy i funkcje-mocki | **Nie** — nie czyta env ani bazy |

### Szczegóły techniczne (w prostym języku)

**Konfiguracja bez sekretów**

- Panel: Company Profile → WordPress Config
- API: `GET/POST /api/v1/tenant/wordpress-config`
- W bazie (`TenantSetting`, klucz `ai_delivery_wordpress_connection`) trafiają tylko: `siteUrl`, `siteSlug`, `wordPressComSite`
- Jeśli ktoś spróbuje wysłać hasło lub token — API odrzuca żądanie (błąd 400)
- Komunikat w UI jest jasny: „tylko konfiguracja bez credentiali”, „publikacja wyłączona”

**Przygotowanie draftu**

- Przycisk „Prepare WordPress Draft” w AI Delivery
- API: `POST .../prepare-wordpress-draft`
- Tworzy lokalną strukturę (tytuł, treść, slug, kategorie, SEO) — **bez** wysyłania niczego na zewnątrz

**Mock publikacji**

- Przycisk „Test WordPress publish”
- API: `POST .../publish-wordpress`
- Zawsze zwraca: publikacja wyłączona, brak zewnętrznego posta

### Czego dziś **nie ma** w UI ani w API

- Brak pola na Application Password / hasło WordPress
- Brak przycisku „Test połączenia” z WordPressem
- Brak realnej publikacji postów
- Brak szyfrowania credentiali (bo credentiali w ogóle nie zapisujemy)

### Zgodność z PRD

PRD (`prd.md.txt`) traktuje WordPress jako:

> Site config + draft preparation foundation; **no credentials stored in UI**; **full publishing gated**

To jest zgodne z obecnym kodem i dokumentacją.

---

## 2. Co jest zabronione w MVP

Poniższe reguły obowiązują **do momentu** zatwierdzenia i wdrożenia osobnego bloku „credential encryption foundation” (patrz sekcja 4).

### Absolutnie zabronione

| Akcja | Dlaczego |
|-------|----------|
| Zapisywanie haseł, tokenów, Application Password w bazie **bez szyfrowania** | Ryzyko wycieku przy backupie DB lub logach |
| Zapisywanie credentiali w plikach `.env` per tenant | Env jest globalny — nie pasuje do modelu multi-tenant |
| Zapisywanie credentiali w repozytorium git | Sekrety w historii git są praktycznie nieusuwalne |
| Zwracanie plaintext hasła w odpowiedzi API lub UI | Każdy z dostępem do przeglądarki/network tab widzi sekret |
| Logowanie haseł, tokenów, nagłówków Authorization | Logi często mają szerszy dostęp niż baza |
| Realne wywołania WordPress REST API | Wymaga credentiali, których jeszcze nie mamy bezpiecznie |
| „Test połączenia” z żywym WordPressem | To samo — wymaga sekretów |
| Udostępnianie credentiali klientom (Client Portal) | MVP jest admin-first; klient nie powinien widzieć haseł WP |
| Automatyczna publikacja bez ludzkiego przeglądu deliverable | Zasada produktu: AI przygotowuje, człowiek zatwierdza |

### Dozwolone dziś (i nadal dozwolone)

- Konfiguracja publiczna strony (URL, slug, WordPress.com)
- Lokalne przygotowanie draftu
- Mock/test endpoint z komunikatem „wyłączone”
- Dokumentacja i projektowanie (ten dokument)

---

## 3. Proponowany model bezpieczeństwa credentiali

### 3.1 Zasada nadrzędna

> **Credentiale WordPress są sekretem per tenant. Nigdy nie są plaintext w bazie, w odpowiedzi API, w UI po zapisie ani w logach.**

Oddzielamy dwa światy:

```text
[Nie-sekret]                    [Sekret — przyszły blok]
siteUrl, siteSlug,              Application Password
wordPressComSite                 (ew. przyszłe tokeny OAuth)
     ↓                                  ↓
TenantSetting                      TenantSetting (zaszyfrowane)
klucz: wordpress_connection        klucz: wordpress_credentials
(już istnieje)                     (nowy, osobny klucz)
```

### 3.2 Gdzie trzymać credentiale

**Rekomendacja: zaszyfrowane pole w `TenantSetting` per tenant**

| Element | Propozycja |
|---------|------------|
| **Magazyn** | PostgreSQL, tabela `TenantSetting` |
| **Klucz ustawienia** | Osobny od konfiguracji publicznej, np. `ai_delivery_wordpress_credentials` |
| **Zawartość** | JSON z zaszyfrowanym `applicationPassword` (+ metadane: `updatedAt`, `updatedByUserId`) |
| **Nie w env** | Globalny `WORDPRESS_PASSWORD` w `.env` — **odrzucony** (jeden klucz ≠ wiele tenantów/klientów) |
| **Nie w R2/plikach** | Na razie nie — credentiale to małe stringi, DB z szyfrowaniem wystarczy na MVP |

**Dlaczego nie osobny vault (HashiCorp Vault, AWS Secrets Manager) na start?**

- DCA OS Lite MVP działa na jednym VPS z PostgreSQL
- Vault dodaje operacyjną złożoność (kolejny serwis, backup, dostęp)
- Szyfrowanie at-rest w DB + klucz master w env to akceptowalny pierwszy krok
- Vault/KMS można rozważyć później przy skalowaniu multi-region lub compliance

### 3.3 Szyfrowanie

**Algorytm:** AES-256-GCM (standard branżowy, wbudowany w Node.js `crypto`)

**Przepływ:**

```text
1. Admin wpisuje Application Password w UI (jednorazowo, pole maskowane)
2. API odbiera hasło tylko przez HTTPS
3. encryption.service.ts szyfruje wartość kluczem master
4. Do bazy trafia ciphertext + IV + auth tag (nie plaintext)
5. Odczyt: tylko backend przy publikacji/testie — decrypt in-memory, nigdy nie zwracać do UI
```

**Źródło klucza szyfrowania (master key):**

| Opcja | Opis | Rekomendacja MVP |
|-------|------|------------------|
| **A. Klucz w env** | `CREDENTIAL_ENCRYPTION_MASTER_KEY` (32 bajty, base64) | ✅ Najprostsze na start |
| **B. Klucz per tenant** | Master key + tenant ID → derived key | ✅ Dodatkowa izolacja — rekomendowane razem z A |
| **C. Zewnętrzny KMS** | AWS KMS, GCP KMS | Później, jeśli wymagane |

**Env master key:**

- Ustawiany tylko na serwerze API (nigdy w frontendzie, nigdy w git)
- Osobny klucz na staging i production
- Rotacja: nowy klucz + re-szyfrowanie credentiali (patrz 3.5)

**Co jeśli master key zginie?**

- Bez klucza credentiale są nie do odczytania — trzeba będzie wpisać je ponownie w UI
- Backup DB bez backupu klucza = bezużyteczne zaszyfrowane dane
- **Wymóg operacyjny:** master key i backup DB muszą być zarządzane niezależnie (np. klucz w menedżerze haseł, nie obok dumpu DB)

### 3.4 Kto ma dostęp

| Rola | Konfiguracja publiczna (URL) | Zapisywanie credentiali | Odczyt plaintext hasła | Publikacja do WP |
|------|------------------------------|-------------------------|------------------------|------------------|
| **Owner** | ✅ | ✅ | ❌ (nigdy w UI po zapisie) | ✅ |
| **Admin** | ✅ | ✅ | ❌ | ✅ |
| **Operator / inne role** | ❌ | ❌ | ❌ | ❌ |
| **Klient (Client Portal)** | ❌ | ❌ | ❌ | ❌ |
| **Backend (runtime)** | ✅ odczyt URL | ✅ zapis zaszyfrowany | ✅ tylko in-memory przy wywołaniu WP | ✅ po zatwierdzeniu flow |

**Zasady RBAC:**

- Wszystkie endpointy credentiali: `requireRole("owner", "admin")` + tenant scope
- Frontend: panel credentiali osobno od panelu URL (nie mieszać formularzy)
- Po zapisie UI pokazuje tylko: „Credentials saved” + opcjonalnie „last updated” — **nigdy** wartość hasła

### 3.5 Rotacja credentiali

**Dwa poziomy rotacji:**

| Typ | Kiedy | Jak |
|-----|-------|-----|
| **Rotacja Application Password (WordPress)** | Co 90 dni lub po incydencie / odejściu pracownika | Admin generuje nowe hasło w WordPress → wpisuje w DCA OS → „Save credentials” nadpisuje zaszyfrowaną wartość |
| **Rotacja master key (szyfrowanie)** | Rzadko (np. rocznie) lub po podejrzeniu wycieku klucza | Nowy env key → skrypt re-encrypt wszystkich credentiali → weryfikacja → stary klucz usunięty |

**WordPress Application Password — dobre praktyki:**

- Jedno Application Password na tenant / stronę (nie współdzielone między ludźmi)
- W WordPress: nazwa np. `DCA OS Lite — tenant XYZ`
- Możliwość unieważnienia w panelu WordPress bez zmiany hasła głównego użytkownika WP

### 3.6 Audyt

**Co logujemy (AuditLog):**

| Akcja | Przykładowy event | Metadane (bezpieczne) |
|-------|-------------------|------------------------|
| Zapis credentiali | `WORDPRESS_CREDENTIALS_UPDATED` | `{ credentialsPresent: true, updatedAt, siteUrlHost }` |
| Usunięcie credentiali | `WORDPRESS_CREDENTIALS_DELETED` | `{ deletedAt }` |
| Test połączenia | `WORDPRESS_CONNECTION_TESTED` | `{ testedAt, verified: true/false }` — **bez** body odpowiedzi WP |
| Publikacja posta | `WORDPRESS_PUBLISH_ATTEMPTED` | `{ deliverableId, status, externalPostId? }` — **bez** credentiali |
| Błąd auth | `WORDPRESS_AUTH_FAILED` | `{ errorCategory: "INVALID_CREDENTIALS" }` — **bez** szczegółów WP |

**Czego NIGDY nie logujemy:**

- Application Password (plaintext ani zaszyfrowany)
- Nagłówki `Authorization`
- Pełne URL z tokenami query string
- Stack trace zawierający request body z hasłem

**Redakcja:**

- Helper `redactCredential(value)` → `"***REDACTED***"`
- Helper `sanitizeCredentialMetadata(obj)` — usuwa pola pasujące do listy forbidden keywords (ta sama lista co w config API dziś)

### 3.7 Proponowane API (przyszły blok — po zatwierdzeniu)

```
POST   /api/v1/tenant/wordpress-credentials          — zapis (encrypt at rest)
GET    /api/v1/tenant/wordpress-credentials          — status: present/masked, never plaintext
POST   /api/v1/tenant/wordpress-credentials/test     — test połączenia
DELETE /api/v1/tenant/wordpress-credentials          — usunięcie
```

Osobno od istniejącego `/wordpress-config` (publiczny URL).

### 3.8 Proponowany UI (przyszły blok)

- Lokalizacja: Company Profile → sekcja **„WordPress Credentials”** (osobna od „WordPress Site Config”)
- Pole: Application Password (type=password, masked)
- Przyciski: Save, Test Connection, Delete credentials
- Komunikat: „Hasło jest szyfrowane. Po zapisie nie wyświetlamy go ponownie.”
- Brak auto-fill, brak kopiowania do schowka po zapisie

### 3.9 Typ credentiali WordPress

| Scenariusz | Typ auth | MVP |
|------------|----------|-----|
| Self-hosted WordPress | Application Password (REST API) | ✅ Docelowy standard |
| WordPress.com (Business/eCommerce z pluginem) | Application Password lub OAuth | Application Password na start |
| WordPress.com (darmowy bez REST) | Ograniczony | Poza MVP — wymaga innej integracji |

---

## 4. Warunki wstępne przed włączeniem pełnego publikowania

Pełne publikowanie = realne `POST` do WordPressa tworzące post (nie mock).

### Faza A — Fundament szyfrowania (osobny blok, przed credentialami WP)

| # | Wymaganie | Dowód ukończenia |
|---|-----------|------------------|
| A1 | `encryption.service.ts` — encrypt/decrypt AES-256-GCM | Kod + unit testy |
| A2 | Master key w env, dokumentacja rotacji | `docs/security/CREDENTIAL_ENCRYPTION_FOUNDATION.md` |
| A3 | Rozszerzenie schematu DB (np. flaga `encrypted` na TenantSetting) | Migracja Prisma zatwierdzona |
| A4 | Redaction helpers | Testy: plaintext nie w logach |
| A5 | Smoke: `scripts/smoke-credential-encryption.mjs` exit 0 | CI / lokalny smoke |
| A6 | Przegląd bezpieczeństwa fundamentu | Sign-off właściciela |

### Faza B — Credentiale WordPress (blok po Fazie A)

| # | Wymaganie | Dowód ukończenia |
|---|-----------|------------------|
| B1 | API credentiali (save/get masked/delete/test) | Smoke + RBAC testy |
| B2 | UI credentiali oddzielone od config URL | UI smoke |
| B3 | Audit events bez sekretów | Inspekcja AuditLog |
| B4 | Test konta WordPress (staging) | Operator checklist |
| B5 | Dokument rollback (usuwanie posta, rotacja hasła) | Runbook |

### Faza C — Realna publikacja (blok po Fazie B)

| # | Wymaganie | Dowód ukończenia |
|---|-----------|------------------|
| C1 | WordPress REST client (posts, media) | Integracja smoke na test WP |
| C2 | Mapowanie prepared draft → WP payload | Zgodność z `prepare-wordpress-draft` |
| C3 | Persist external post ID / URL na deliverable | DB field lub metadata |
| C4 | Error handling: auth fail, rate limit, timeout | Dokumentacja + testy |
| C5 | Human gate: publish tylko po review deliverable | Reguła produktowa w UI |
| C6 | Rate limiting po stronie DCA OS | Nie floodować WP API |
| C7 | Smoke publikacji na izolowanym koncie testowym | `smoke-wordpress-publish` |

### Faza D — Produkcja (świadoma decyzja właściciela)

| # | Wymaganie |
|---|-----------|
| D1 | Osobny master key production (nie ten sam co dev) |
| D2 | Backup DB + procedura odzyskiwania klucza udokumentowana |
| D3 | Lista tenantów z włączonym WP publish — świadoma akceptacja ryzyka |
| D4 | Monitoring: alert na `WORDPRESS_AUTH_FAILED` spike |
| D5 | Explicit approval na deploy z live WordPress |

**Kolejność jest sztywna:** A → B → C → D. Nie pomijamy A.

---

## 5. Checklist dla właściciela produktu (zatwierdzenie przed implementacją)

Właściciel (nietechniczny) — zaznacz **TAK/NIE** przed każdym blokiem implementacji.

### Zanim zaczniemy Fazę A (szyfrowanie)

- [ ] **Rozumiem**, że dziś WordPress nie publikuje na żywo i nie przechowuje haseł — i tak ma zostać do zatwierdzenia tego planu.
- [ ] **Akceptuję**, że credentiale będą w bazie PostgreSQL, ale **zaszyfrowane** — nie jako zwykły tekst.
- [ ] **Akceptuję**, że na serwerze będzie jeden tajny klucz szyfrowania (w env) — muszę wiedzieć, gdzie go bezpiecznie przechowuję (np. menedżer haseł, nie w notatniku).
- [ ] **Rozumiem**, że utrata klucza szyfrowania = konieczność ponownego wpisania haseł WordPress (nie da się „odczytać” starych).
- [ ] **Akceptuję**, że tylko Owner/Admin w systemie może zapisywać credentiale — klienci i inni użytkownicy nigdy ich nie zobaczą.

### Zanim zaczniemy Fazę B (credentiale WordPress)

- [ ] **Akceptuję** osobny panel „WordPress Credentials” obok istniejącego panelu URL.
- [ ] **Rozumiem**, że po zapisie hasła system **nie pokaże** go ponownie — to zamierzone (jak w bankowości).
- [ ] **Zobowiązuję się** do rotacji Application Password w WordPress co ~90 dni (lub po incydencie).
- [ ] **Mam** (lub utworzę) dedykowane konto/użytkownika WordPress tylko dla DCA OS — nie używam hasła głównego admina WP.

### Zanim zaczniemy Fazę C (realna publikacja)

- [ ] **Akceptuję**, że publikacja wymaga ludzkiego przeglądu deliverable przed wysyłką (AI nie publikuje samo).
- [ ] **Mam** testową stronę WordPress do smoke testów (nie produkcyjną klienta na start).
- [ ] **Rozumiem** ryzyko: błędny publish = post widoczny na stronie — potrzebny plan cofnięcia (usunięcie draftu/posta w WP).
- [ ] **Akceptuję** kolejność: najpierw test na staging, dopiero potem produkcja.

### Zanim włączymy na produkcji (Faza D)

- [ ] **Osobno zatwierdzam** deploy z live WordPress (to nie jest automatyczne po merge kodu).
- [ ] **Wiem**, które tenanty/klientów będą mieli włączoną publikację.
- [ ] **Mam** procedurę na wypadek wycieku: rotacja Application Password + ewentualnie master key.

### Podpis decyzji (do uzupełnienia przez właściciela)

| Decyzja | Data | TAK/NIE | Notatki |
|---------|------|---------|---------|
| Faza A — fundament szyfrowania | | | |
| Faza B — credentiale WP | | | |
| Faza C — realna publikacja | | | |
| Faza D — produkcja live WP | | | |

---

## Diagram przepływu (docelowy, po pełnej implementacji)

```text
Operator (Owner/Admin)
  │
  ├─► [Company Profile] Zapisuje URL strony (bez sekretu) ──► TenantSetting (plaintext OK)
  │
  ├─► [Company Profile] Zapisuje Application Password ──► API encrypt ──► TenantSetting (ciphertext)
  │
  ├─► [AI Delivery] Prepare WordPress Draft ──► lokalny JSON (bez WP)
  │
  ├─► [AI Delivery] Review deliverable ──► human approval
  │
  └─► [AI Delivery] Publish to WordPress
         │
         ├─► API decrypt credentials (in-memory only)
         ├─► POST wp-json/wp/v2/posts
         ├─► AuditLog (bez sekretów)
         └─► Zapis externalPostId na deliverable
```

---

## Ryzyka i mitigacje (skrót)

| Ryzyko | Mitigacja |
|--------|-----------|
| Wyciek backupu DB | Szyfrowanie at-rest; master key poza backupem |
| Wyciek logów | Redaction helpers; zakaz logowania auth headers |
| Błędny tenant widzi cudze credentiale | Tenant scope na każdym query; testy izolacji |
| Opuszczony pracownik z dostępem Admin | Rotacja Application Password; revoke w WP |
| Publikacja bez review | UI gate + status deliverable |
| Atak na API | HTTPS, RBAC, rate limit, istniejące security headers |

---

## Powiązanie z istniejącą decyzją STOP

Dokument [`WORDPRESS_CREDENTIAL_POLICY_DECISION.md`](../ai-delivery/WORDPRESS_CREDENTIAL_POLICY_DECISION.md) pozostaje w mocy:

> **STOP** — żadnych credentiali, żadnych realnych wywołań WP, dopóki fundament szyfrowania nie zostanie zatwierdzony i wdrożony.

Ten dokument (`WORDPRESS_CREDENTIAL_SECURITY_DESIGN.md`) jest **planem**, jak ten STOP bezpiecznie zniesć w kontrolowanych fazach.

---

## Podsumowanie dla właściciela produktu (PL)

**Gdzie jesteśmy:** DCA OS Lite umie już zapisać adres strony WordPress i przygotować treść posta lokalnie — ale **nie łączy się** z WordPressem i **nie przechowuje** żadnych haseł. To celowe i bezpieczne.

**Czego nie robimy w MVP:** Nie zapisujemy haseł w bazie, nie publikujemy na żywo, nie dajemy klientom dostępu do credentiali.

**Co proponujemy:** Gdy będziesz gotów, wdrożymy to w 4 krokach: (1) szyfrowanie w systemie, (2) bezpieczny zapis Application Password per firma/tenant, (3) testowa, potem prawdziwa publikacja z ludzkim zatwierdzeniem, (4) świadome włączenie na produkcji.

**Twoja rola:** Przed każdym krokiem zaznaczasz checklistę w sekcji 5 — szczególnie: gdzie trzymasz klucz szyfrowania, że hasła WP rotujesz co kilka miesięcy, i że publikacja na produkcję wymaga osobnej zgody.

**Najważniejsza zasada:** Hasło WordPress nigdy nie leży w bazie jako zwykły tekst i nigdy nie wraca do ekranu po zapisie — tak jak w dobrym systemie bankowym.

---

**GATE: dokumentacja only | backend/schema/API: nie dotknięte | commit: brak (czeka na zgodę właściciela)**
