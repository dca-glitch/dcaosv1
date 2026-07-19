# DCA OS v2 — kanoniczne przekazanie kontekstu do kolejnego czatu

**Pierwotna data:** 17 lipca 2026
**Ostatnia aktualizacja:** 19 lipca 2026
**Status:** pełny handoff właścicielski po zamknięciu Phase 1 oraz rozpoczęciu owner discovery dla Phase 2
**System:** DCA OS v2, rozwijany z istniejącego DCA OS Lite / DCA OS v1
**Repozytorium:** `dca-glitch/dcaosv1`
**Lokalna ścieżka właściciela:** `C:\dcaosv1`
**Zweryfikowany baseline przed aktualizacją handoffu:** `e4cd592c65601bd947991123df14ed2d8e8f3884` (`PR #72`)
**Nie dotyczy:** Tellanic OS — jest to całkowicie odrębny system i jego repozytorium, dokumentacja ani stan wdrożenia nie mogą być mieszane z DCA OS.

---

## 1. Cel dokumentu

Ten dokument jest kanonicznym handoffem do kolejnego czatu. Ma zapobiec utracie decyzji, ponownemu otwieraniu zamkniętych tematów i pomyleniu DCA OS v2 z Tellanic OS albo ze starszym planem pre-staging DCA OS Lite.

Nowy chat powinien:

1. najpierw przeczytać cały dokument;
2. traktować sekcję **Decyzje finalne** jako wiążącą;
3. nie przywracać decyzji oznaczonych jako zastąpione;
4. przed każdą nową misją potwierdzić bieżący `main`, otwarte PR-y, CI i stan lokalnego repozytorium;
5. rozstrzygnąć wyłącznie elementy oznaczone jako otwarte lub konfliktowe;
6. zachować produkcję, VPS, remote DB, live integrations, sekrety, koszty, destrukcyjne migracje oraz Tellanic poza zakresem, dopóki właściciel nie wyda osobnej, jednoznacznej zgody.

---

## 2. Najważniejsza zmiana charakteru produktu

### Decyzja finalna

DCA OS v2 przestaje być projektowany jako wieloorganizacyjny SaaS sprzedawany niezależnym tenantom. Staje się **prywatnym Agency Operations System dla jednej organizacji: Digital Cube Agency**.

System ma obsługiwać codzienną pracę agencji, jej marki własne oraz klientów zewnętrznych. Nie jest publicznym produktem self-service.

### Konsekwencje

Z docelowego modelu usuwamy lub wygaszamy:

- publiczny signup;
- samodzielne tworzenie tenantów;
- tenant-admin provisioning;
- plany abonamentowe i tenant billing;
- marketplace;
- publiczną sprzedaż dostępu do systemu;
- architekturę zakładającą wiele niezależnych organizacji jako klientów SaaS.

Pozostają i stają się jeszcze ważniejsze:

- ścisła izolacja danych pomiędzy Workspace;
- memberships i role;
- autoryzacja po stronie serwera;
- deny-by-default;
- audit log;
- limity i budżety AI;
- eksport, retencja, archiwizacja i usuwanie;
- bezpieczne API oraz kontrolowane integracje;
- feature flags i cutover per Workspace.

### Model organizacyjny

W systemie istnieje jedna organizacja nadrzędna: **Digital Cube Agency**.

Pod nią występują dwa typy Workspace:

1. **Internal Brand** — marka lub przedsięwzięcie własne DCA.
2. **External Client** — klient zewnętrzny obsługiwany przez DCA.

Workspace jest podstawową granicą danych, autoryzacji, raportowania, kosztów, integracji, materiałów i wyszukiwania.

Puriva jest pierwszym External Client i pierwszym pilotem DCA OS v2. Nie jest osobnym forkiem ani osobnym produktem.

---

## 3. Granice danych i prywatności

### Decyzje finalne

- DCA OS nie zbiera i nie będzie zbierać danych medycznych pacjentów.
- Puriva może przekazywać materiały marketingowe before/after, zdjęcia, testimonials i inne zasoby, ale odpowiedzialność za zgody leży po stronie klienta.
- Takie zasoby są traktowane jako zatwierdzone materiały marketingowe, nie dokumentacja medyczna.
- System nie ma przechowywać consent records pacjentów ani historii leczenia.
- Dane biznesowe i marketingowe mogą być przetwarzane przez system.
- Zasoby wrażliwe marketingowo mogą trafić do AI wyłącznie przez właściwy, zatwierdzony workflow i zgodnie z polityką Workspace.
- Chain-of-thought, pełne sekrety i pełne tokeny nie mogą trafiać do logów ani archiwów.

### Konsekwencja dla Puriva

W pilocie nie mogą pojawić się dane pacjentów ani indywidualne dane medyczne. Zdjęcia before/after są dopuszczalne tylko jako client-approved marketing assets.

---

## 4. Role i podstawowe granice uprawnień

Finalnie przyjęty model operuje pięcioma rolami:

### Admin

- najwyższa władza systemowa;
- konfiguracja integracji i credentials;
- zarządzanie wyjątkami i awariami;
- finalna kontrola operacji Production;
- Deliver Draft dla External Client i operacji produkcyjnych;
- kontrolowany override budżetu AI;
- eksport pełnego audytu i dostęp do sekcji Finance;
- nie może usuwać ani redagować pojedynczych audit events;
- AI nie może zastąpić Admina w zatwierdzaniu, aktywacji integracji ani publikowaniu.

### Workspace Manager

- wewnętrzny właściciel operacyjny konkretnego Workspace;
- zarządza codzienną pracą, Team Members, materiałami i approval po stronie DCA;
- może publikować Approved AI Advice do Client View;
- widzi procent, prognozę i pozostały procent budżetu AI, ale nie musi widzieć kwot;
- może klasyfikować zmianę jako `non-substantive` wraz z uzasadnieniem;
- dla Internal Brand może docelowo otrzymać uprawnienie Deliver Draft, ale ten wariant nie będzie sprawdzany w pilocie Puriva i wymaga osobnego staging rehearsal przed rolloutem Internal Brands.

### Team Member

- wykonuje pracę w przydzielonym Workspace;
- tworzy i edytuje Briefs, Work i Materials zgodnie z zakresem roli;
- nie może sam zachować istniejącego approval po swojej zmianie;
- nie może publikować, aktywować integracji ani wykonywać operacji zastrzeżonych dla Admina lub Workspace Managera.

### Client Manager

- główna osoba decyzyjna po stronie External Client;
- zatwierdza materiały lub deleguje ograniczone approval do Client User;
- zarządza delegacją w ramach swojego Workspace;
- może natychmiast wycofać delegację;
- zmiany Briefu dotyczące zakresu, kosztu lub zobowiązań pozostają domyślnie zastrzeżone dla Client Managera.

### Client User

- korzysta z ograniczonego Client View tego samego Workspace;
- nie otrzymuje osobnego magazynu danych ani osobnej kopii materiałów;
- może komentować, zgłaszać zmiany i — tylko po kontrolowanej delegacji — zatwierdzać określone typy materiałów, Content Areas, projekty lub zakres czasowy;
- widzi wyłącznie Approved AI Advice;
- nie widzi credentials, pełnego audytu, danych Finance ani wewnętrznych draftów AI.

**Aktualna granica pilota Puriva:** Client User ma wyłącznie dostęp do miesięcznych raportów i nie otrzymuje approval ani WordPress permissions. Ogólna możliwość delegowania approval opisana poniżej pozostaje wcześniejszym kierunkiem produktowym i nie jest autoryzacją dla Puriva ani bieżącego runtime.

### Zasada nadrzędna

Ukrycie ekranu lub przycisku jest tylko UX. Każdy endpoint, job, plik, raport i wynik wyszukiwania musi być autoryzowany po stronie serwera, jawnie scoped do Workspace i fail-closed.

### Element nadal wymagający formalizacji

Pełna macierz `rola × zasób × akcja × typ Workspace × stan workflow` nie została jeszcze zapisana jako kanoniczny artefakt. Jest to jedno z pierwszych zadań dokumentacyjnych przed implementacją domenową.

---

## 5. Model domenowy i podstawowe pojęcia

Docelowa oś operacyjna:

`Request → Brief → Work → Material → Approval → Final Check → Deliver Draft → Publish/External State`

### Workspace

Podstawowa granica tenant-like, ale wewnątrz jednej agencji. Każdy rekord domenowy musi należeć do Workspace bezpośrednio albo przez jednoznacznie weryfikowalną relację.

### Website

Zewnętrzny target WWW należący do Workspace. Workspace może mieć wiele Websites. Każdy Website ma oddzielne:

- środowisko/target CMS;
- credentials;
- konfigurację integracji;
- politykę Direct-to-Draft;
- mapowanie analytics;
- status zdrowia i ostatniej synchronizacji;
- dane external IDs.

### Content Area

Logiczny obszar treści w ramach Website lub Workspace, np. blog. Uprawnienia delegowane, materiały, approval i raportowanie mogą być ograniczone do Content Area.

### Material

Wersjonowany rezultat pracy. Ma osobne osie statusu:

1. status produkcji;
2. status approval;
3. status publishing/delivery.

Nie wolno spłaszczać ich do jednego wspólnego pola statusu.

### Client View

Ograniczony widok tego samego Workspace. Nie jest osobnym portalem z duplikowaną bazą danych.

---

## 6. Workflow, wersjonowanie i approval

### Decyzja finalna: kontrolowana ręczna klasyfikacja zmian

Pierwotny wybór właściciela `1C` został zabezpieczony i finalnie przyjęty jako `4A`:

- każda zmiana tworzy nową wersję;
- domyślnie nowa wersja wymaga ponownego approval;
- Workspace Manager lub Admin może oznaczyć zmianę jako `non-substantive`;
- klasyfikacja wymaga uzasadnienia;
- zmiany treści, zakresu, celu, ceny/budżetu, zobowiązań, Website, publikacji lub wyniku AI zawsze unieważniają approval;
- Team Member będący autorem zmiany nie może sam zachować approval;
- decyzja jest audytowana i widoczna dla poprzedniego approvera.

### State machines

Przyjęto trzy kontrolowane state machines dla Material:

- production state;
- approval state;
- publishing/delivery state.

Przejścia wykonuje jeden kontrolowany domain service. System ma blokować kombinacje niemożliwe, np. `Published` bez właściwego Final Check i dostarczenia zatwierdzonej wersji.

### Delegowane approval

Client Manager może delegować Client User prawo approval:

- tylko dla konkretnego Workspace;
- z datą ważności;
- dla wybranego typu materiałów, Content Area, projektu lub okresu;
- w sposób jawny i audytowany;
- z możliwością natychmiastowego wycofania;
- z zapisaniem, czy approval wynikał z roli podstawowej, czy delegacji.

Zmiany Briefu dotyczące zakresu, kosztu i zobowiązań pozostają domyślnie tylko dla Client Managera.

W zatwierdzonym Puriva Client Operating Pack approval wykonują Client Managers. Client User pozostaje report-only. Każde przyszłe włączenie delegowanego approval wymaga osobnego, Workspace-scoped pakietu i nie może być domyślnie odziedziczone z tej koncepcji.

### Element nadal wymagający formalizacji

Dokładne listy stanów i wszystkich legalnych przejść dla Request, Brief, Work, Material, Approval, AI Advice, Report, Delivery i Sync Run nie zostały jeszcze zapisane w jednej kanonicznej specyfikacji.

---

## 7. WordPress i model Direct-to-Draft

### Decyzja finalna

Wybrano **Direct-to-Draft** jako prostszy docelowy model współpracy z WordPress.

**Stan implementacji na 19 lipca 2026:** lokalna prepared-draft/admin foundation jest udowodniona, ale live HTTP Direct-to-Draft i Publish nie są aktualnie wdrożoną ani autoryzowaną capability. Dla External Client finalna ręczna publikacja pozostaje operacją Admina.

Podział odpowiedzialności:

#### WordPress Admin kontroluje

- aktualizacje pluginów;
- aktualizacje WordPress;
- aktualizacje theme;
- utrzymanie instalacji i serwera;
- finalną ręczną publikację w WordPress, jeżeli obowiązuje dla danego targetu.

#### DCA OS kontroluje

- treści;
- bloki;
- media i alt text;
- przygotowanie initial design;
- child theme jako artefakt do kontrolowanego wdrożenia;
- draft delivery;
- historię wersji, approval i dowody dostarczenia.

### Deliver Draft i Publish są twardo rozdzielone

- osobne operacje;
- osobne uprawnienia;
- osobne statusy;
- osobne audit events;
- osobne idempotency keys;
- Deliver Draft nigdy automatycznie nie oznacza Publish.

### Bezpieczeństwo i niezawodność delivery

Każda dostawa ma:

- stabilny idempotency key;
- zapis bezpiecznych request/response metadata;
- external identifier;
- duplicate prevention;
- reconciliation przed retry;
- obsługę stanu niejednoznacznego przez Admina;
- draft-only guard tam, gdzie publikacja końcowa ma pozostać ręczna.

Nie wolno automatycznie tworzyć kolejnego draftu po timeout bez wcześniejszego sprawdzenia, czy poprzedni już powstał.

### Wymagania integracyjne już wskazane

Kontrakt WordPress powinien objąć co najmniej:

- payload treści;
- slug;
- author mapping;
- taxonomy mapping;
- media;
- alt text;
- idempotency;
- duplicate prevention;
- retry i reconciliation;
- draft-only guard;
- external publication/delivery status.

### Otwarte szczegóły

- dokładny kontrakt API/pluginu WordPress;
- obsługiwane typy bloków i ich wersjonowanie;
- sposób instalowania/aktualizowania child theme oraz rollbacku;
- różnice uprawnień Direct-to-Draft między Internal Brand i External Client;
- zakres live proof dla każdego targetu Puriva.

---

## 8. AI, automatyzacja i n8n

### Granice autonomii AI

AI może:

- analizować;
- generować;
- rekomendować;
- przygotowywać drafty;
- wspierać klasyfikację i pracę operatora.

AI nie może:

- zatwierdzać;
- zmieniać uprawnień;
- aktywować integracji;
- ujawniać sekretów;
- wykonywać finalnego Publish;
- omijać human gates.

### Admin i automatyzacja

Worker automatyzuje rutynę: synchronizacje, raporty, retry i monitoring. Admin konfiguruje integracje i zajmuje się wyjątkami, błędami oraz operacjami o podwyższonym ryzyku.

### n8n

n8n może korzystać wyłącznie z kontrolowanego API:

- bez bezpośredniego dostępu do PostgreSQL;
- bez głównych credentials;
- bez dostępu do wewnętrznych usług poza audytowanymi endpointami;
- przez ograniczony service account;
- każdy workflow ma właściciela, Workspace scope, limit operacji i możliwość natychmiastowego unieważnienia tokenu.

### AI Advice

- klient widzi wyłącznie Approved AI Advice;
- publikacja do Client View następuje po human gate przez Workspace Managera lub Admina;
- draft AI nie jest ujawniany klientowi;
- wersje Advice podlegają zasadom wersjonowania i ponownego approval.

---

## 9. Budżety AI i Finance

### Finalna polityka 75/90/100

- 75% — informacja dla Workspace Managera i Admina;
- 90% — ostrzeżenie oraz prognoza przekroczenia;
- 100% — hard stop dla uruchamiania nowych płatnych jobów AI;
- rozpoczęty job może się zakończyć w ramach uprzednio zarezerwowanego kosztu;
- funkcje systemu niewytwarzające nowego kosztu providera pozostają dostępne;
- System budget jest oddzielony od Workspace budgets;
- jeden Workspace nie może zużyć budżetu innego;
- tylko Admin może jednorazowo zwiększyć limit lub wykonać kontrolowany override;
- override wymaga powodu i trafia do audytu;
- Workspace Manager widzi procent, prognozę i pozostały procent, niekoniecznie kwoty;
- rozliczenie miesięczne;
- niewykorzystany budżet domyślnie nie przechodzi na kolejny miesiąc.

### Rezerwacja kosztu

Przed startem płatnego joba system atomowo rezerwuje szacowany koszt. Po zakończeniu rozlicza koszt rzeczywisty i zwalnia różnicę. Zapobiega to równoczesnemu uruchomieniu wielu jobów na podstawie tego samego dostępnego salda.

### Otwarte szczegóły

- waluta i źródło kursów;
- model estymacji kosztu per provider/model;
- zasady zachowania przy przekroczeniu rezerwacji;
- limity per user/job/model;
- widoki i eksporty Finance;
- księgowe znaczenie rekordów kosztowych.

---

## 10. Analytics, GA4/GSC, miesięczne snapshoty i raporty

### Decyzje podjęte w tym czacie

- worker miał wykonywać automatyczne synchronizacje;
- tylko Admin miał konfigurować połączenia, wykonywać manual sync i obsługiwać błędy;
- synchronizacja miała używać staging danych i atomic promotion;
- niekompletny run nie zastępuje ostatniego poprawnego snapshotu;
- nieudany run pozostaje dostępny diagnostycznie dla Admina;
- opublikowany raport miesięczny jest zamkniętym snapshotem;
- korekta raportu tworzy nową wersję, poprzednia pozostaje w audycie.

### Bieżący konflikt kanoniczny — wymaga writebacku przed implementacją Google

We wcześniejszym, później utrwalonym kierunku DCA OS Lite **live integracje Google (GA4/GSC, OAuth/service accounts i live sync) zostały wycofane z bieżącego i planowanego scope**, a ewentualny model ręcznego CSV miał wrócić tylko po jawnym ponownym otwarciu przez właściciela.

W późniejszym Puriva Client Operating Pack discovery zapisano propozycję dopuszczenia live GA4/GSC wyłącznie dla DCA Admina, z oddzielnymi service accounts per Website; klient miałby widzieć tylko miesięczne raporty. Ta propozycja nie jest zatwierdzoną decyzją właścicielską ani bieżącą capability: nie została spójnie zapisana w dokumentach kanonicznych repo, które nadal oznaczają live GA4/GSC jako `WITHDRAWN`.

Nie wolno po cichu zmieniać capability statusu. Przed implementacją Google należy wykonać osobny canonical writeback, który jednoznacznie określi, czy późniejsza decyzja właścicielska formalnie ponownie otwiera live GA4/GSC oraz jaki jest jej dokładny security, credential, environment i rollout gate.

Do czasu rozstrzygnięcia:

- nie implementować OAuth;
- nie tworzyć service accounts;
- nie wykonywać live sync;
- nie traktować braku Google credentials jako blockera Phase 2 ani innych niezależnych pakietów.

### Otwarte szczegóły po ewentualnym ponownym otwarciu

- dokładne mapowanie Workspace → Website → GA4 Property → GSC Site Property;
- strict isolation i fail-closed mismatch;
- zakres metryk;
- normalizacja, redakcja i retencja;
- idempotency sync run;
- contract miesięcznego snapshotu;
- error taxonomy i Admin recovery.

---

## 11. Credentials i SecretVault

### Finalna decyzja: 5A-Free

Bezpłatne application-level envelope encryption + Docker secrets:

1. każdy sekret otrzymuje losowy data encryption key (`DEK`);
2. credentials są szyfrowane `AES-256-GCM`;
3. `DEK` jest szyfrowany key encryption key (`KEK`);
4. PostgreSQL przechowuje tylko ciphertext, zaszyfrowany DEK, nonce, authentication tag i wersję klucza;
5. `KEK` nie trafia do bazy, repo, obrazu ani zwykłej zmiennej środowiskowej;
6. `KEK` jest montowany read-only jako Docker secret;
7. staging i production mają różne klucze;
8. po zapisaniu credentials nie można ponownie wyświetlić — można je zastąpić;
9. użycie, zastąpienie i rotacja są audytowane;
10. recovery key jest zaszyfrowany i przechowywany oddzielnie/offline.

Interfejs ma zachować możliwość przyszłego podłączenia OpenBao, ale OpenBao nie jest teraz wymagany.

### Otwarte szczegóły

- format i wersjonowanie ciphertext envelope;
- procedura rotacji KEK i DEK;
- procedura utraty/recovery klucza;
- dostęp procesów workera do sekretów;
- disaster recovery i restore drill z zaszyfrowanymi sekretami;
- dokładne zasady memory zeroization, cache i timeoutów.

---

## 12. Uploady i storage

### Finalna decyzja

Upload trafia najpierw do prywatnej kwarantanny i przechodzi:

- weryfikację typu;
- limit rozmiaru;
- malware scanning;
- blokadę HTML/SVG albo bezpieczną sanityzację aktywnej treści;
- dopiero po pomyślnym wyniku jest promowany do właściwego storage.

### Wymagania foundation

- tenant/workspace-isolated object keys;
- signed URL policy;
- MIME i size controls;
- upload validation;
- cleanup i orphan detection;
- audit metadata;
- idempotency;
- retention;
- prywatność domyślna.

### Otwarte szczegóły

- konkretny silnik malware scanning;
- typy i limity plików;
- polityka SVG;
- storage provider i środowiska;
- signed URL TTL;
- thumbnail/image processing pipeline;
- zasady klientowskich zdjęć before/after.

---

## 13. Audit log, logowanie i e-mail

### Audit log

Finalna decyzja 25C:

- pełny append-only;
- brak edycji, redakcji i usuwania pojedynczych events;
- korekta jest nowym eventem;
- audit przechowuje tylko kontrolowane pola i bezpieczne metadane;
- pełne payloady, sekrety i niedozwolone dane nie trafiają do audytu;
- dostęp i eksport pełnego audytu są ograniczone do Admina;
- retencja usuwa całe wygasłe zakresy/partycje zgodnie z polityką, a nie pojedyncze wpisy.

### E-mail

- minimalna treść;
- może zawierać nazwę Workspace i rodzaj zdarzenia;
- szczegóły, komentarze, materiały i raporty są dostępne dopiero po zalogowaniu;
- bez poufnego contentu;
- bez załączników zawierających materiały;
- bez signed URL do prywatnego pliku.

E-mail pozostaje głównym kanałem powiadomień. In-system notifications były wcześniej deferred/non-blocking i nie powinny stać się ukrytym blockerem bez jawnego otwarcia zakresu.

---

## 14. Retencja, usuwanie i Google Drive

### Status: PENDING — brak zatwierdzonej polityki retencji

Bieżąca authority chain nie zatwierdza konkretnych okresów retencji, archiwizacji do Google Shared Drive, bezterminowego przechowywania ani procesu usuwania. Raport discovery pozostawia wymagania retencji i evidence do osobnej decyzji właściciela. Poniższy opis zachowuje wcześniejszy, niezatwierdzony kontekst propozycji i nie stanowi execution authority.

Retencja aktywnego systemu:

- dane robocze: 6 miesięcy po zamknięciu;
- audit w DCA OS: 2 lata;
- finalne materiały, approvals i raporty: 3 lata;
- następnie wybrane dane są archiwizowane i usuwane z aktywnej bazy/storage.

### Obowiązkowy pakiet archiwalny

Może zawierać:

- zatwierdzone Briefs;
- finalne Materials i deliverables;
- Approvals i Final Checks;
- raporty miesięczne;
- dowody Deliver Draft i Publish;
- podstawowy activity/audit trail;
- wybrane pliki klienta;
- manifest oraz sumy kontrolne.

Nie archiwizujemy:

- credentials i tokenów;
- service account keys;
- plików tymczasowych;
- pełnych request logs;
- error payloads;
- roboczych promptów AI;
- chain-of-thought;
- nieudanych/testowych generacji;
- zawartości kwarantanny.

### Proces

- firmowy Google Shared Drive, nigdy prywatny dysk użytkownika;
- oddzielny folder per Workspace;
- materiały operacyjne: Admin i właściwy Workspace Manager;
- Finance, koszty AI i pełny audit: oddzielna sekcja Admin-only;
- weryfikacja uploadu, manifestu, rozmiaru i sum kontrolnych;
- usunięcie z DCA OS dopiero po potwierdzeniu kompletności;
- nieudana archiwizacja zatrzymuje deletion i tworzy alert;
- eksport i deletion trafiają do append-only audit;
- credentials są usuwane bez archiwizacji natychmiast po odłączeniu.

### Historyczny, niezatwierdzony wariant bezterminowego przechowywania

Wcześniejsza propozycja zakładała bezterminowe archiwum na Google Drive mimo rekomendacji okresu ograniczonego. Nie jest to zatwierdzona decyzja; poniższe zabezpieczenia pozostają wyłącznie kontekstem do przyszłej decyzji:

- archiwizacja tylko wyselekcjonowanych finalnych danych;
- pseudonimizacja zbędnych danych osobowych;
- okresowy przegląd uprawnień;
- coroczny przegląd podstawy dalszego przechowywania;
- żądanie usunięcia użytkownika/Workspace obejmuje także wyszukanie archiwum;
- legalne żądanie usunięcia może objąć archiwum;
- manifest DCA OS zapisuje lokalizację, zakres i identyfikator archiwum.

### Istotny warunek operacyjny

Jeżeli właściciel zatwierdzi taką politykę w przyszłości, do jej wdrożenia potrzebny będzie firmowy Google Shared Drive oraz jego model uprawnień. Nie należy zakładać, że prywatny My Drive spełnia wymaganie.

### Element wymagający weryfikacji prawnej/księgowej

Bezterminowa retencja zwiększa ryzyko zgodności. Przed produkcją trzeba skonfrontować politykę z umowami DCA, GDPR/inną właściwą jurysdykcją, obowiązkami księgowymi i realną podstawą dalszego przechowywania.

---

## 15. Migracja Client → Workspace i v1 → v2

### Finalna decyzja

Strategia:

`expand → backfill → reconciliation → switch → cleanup`

- nowe struktury dodawane kompatybilnie;
- backfill istniejących danych;
- pełna reconciliation;
- kontrolowany switch za feature flag;
- krótki dual-write dopuszczalny tylko podczas przełączenia;
- brak długotrwałego dual-write;
- cleanup dopiero po okresie obserwacji.

### Migracje bazy

- expand/contract;
- brak wymogu destrukcyjnych automatycznych migracji `down`;
- nowy kod kompatybilny ze starym schematem w oknie przejściowym;
- backup/PITR musi być sprawdzony;
- usuwanie starych kolumn dopiero po obserwacji;
- restore drill jest obowiązkową bramką produkcyjną.

### Cutover

- per Workspace;
- osobny feature flag;
- monitoring;
- reconciliation;
- osobny rollback;
- awaria jednego Workspace nie może wymuszać globalnego rollbacku wszystkich.

### Otwarte szczegóły

- dokładna mapa tabel i pól v1 → v2;
- identyfikacja rekordów osieroconych i cross-client anomalies;
- invariants reconciliation;
- cutover windows;
- czas dual-write;
- cleanup criteria;
- rollback behavior po external side effects.

---

## 16. Backup, restore i niezawodność

### Finalna decyzja

Backup nie jest uznany za działający, dopóki staging nie zostanie skutecznie odtworzony i zweryfikowany.

Restore drill jest obowiązkową bramką przed produkcją.

### Dodatkowe wymagania

- test restore bazy i storage;
- weryfikacja zgodności wersji aplikacji ze schematem;
- procedura dla envelope-encrypted credentials;
- dowód, że rollback nie tworzy duplikatów w systemach zewnętrznych;
- rozdzielenie retry, duplicate existence, reconciliation i rollback;
- brak destrukcyjnego globalnego rollbacku jako domyślnej strategii migracji.

---

## 17. Globalne wyszukiwanie

### Finalna decyzja

Filtrowanie uprawnień następuje w źródle zapytania. Search nie może najpierw znaleźć globalnych wyników i dopiero później ich ukrywać.

Użytkownik nie może poznać:

- nazwy niedostępnego materiału;
- snippetów;
- liczby wyników;
- istnienia zasobu;
- danych z innego Workspace.

---

## 18. Finalny plan faz DCA OS v2

Aktualną kanoniczną sekwencję określa `docs/project-control/DCA_OS_V2_PHASE_0_12_EXECUTION_PLAN.md`. Procenty oznaczają zweryfikowaną implementację, nie zatwierdzony kierunek.

| Phase | Definicja | Stan na 19 lipca 2026 |
|---|---|---|
| 0 | Private-agency charter, scope separation i canonical authority | IMPLEMENTED — 100% |
| 0.5 | Read-only legacy inventory i isolation boundary | IMPLEMENTED — 100% |
| 0.6 | Migration sequence, authorization baseline i rollback boundary | IMPLEMENTED — 100% |
| 1 | Identity, tenancy i Workspace foundation | COMPLETE — 100% |
| 2 | Backfill i reconciliation | NOT_STARTED — P2-A implementation-ready authorized; runtime/data execution remains gated |
| 3 | Scoped authorization i endpoint switch | NOT_STARTED |
| 4 | Legacy cleanup po stabilnej reconciliation | NOT_STARTED |
| 5–12 | Późniejsze bounded product packages i launch preparation | NOT_STARTED |

Poniższe wcześniejsze opisy capability zachowują wartość jako backlog produktowy, ale ich dawne numery Phase 2–12 zostały zastąpione przez powyższą sekwencję migracyjną. Nie wolno używać dawnych numerów jako aktualnej execution authority.

### Aktualna Phase 2 — Backfill and Reconciliation

- Discovery zakończono przez `PR #70`; raport: `docs/discovery/PHASE_2_BACKFILL_RECONCILIATION_DISCOVERY_REPORT.md`.
- Werdykt discovery po P2-02 writeback: `P2-02_OWNER_DECISION_RECORDED; PHASE_2_NOT_STARTED`, nie `READY_FOR_EXECUTION`.
- P2-01 population definition zatwierdzono i zapisano przez `PR #72`.
- Przyszła populacja P2-A to jeden istniejący aktywny lokalny Tenant oraz wszystkie jego aktywne Client, TenantMembership i ClientUserAccess.
- P2-A może przyszłościowo używać wyłącznie zanonimizowanego offline snapshotu z deterministycznym manifestem/hash.
- P2-01 alone did not authorize snapshot creation, database access, or P2-A implementation; the seven subsequent P2-A owner decisions authorize only the offline validator/consumer foundation, without a real snapshot or execution.
- P2-02 is decided: the six active no-role memberships remain excluded and untouched, are classified `OWNER_REMEDIATION_REQUIRED`, receive no default role or access, and cause no data or runtime change. This is documentation-only; Phase 2 remains `NOT_STARTED`.
- P2-A implementation-ready is authorized under seven owner decisions: owner-provided anonymized offline file only; exactly one owner-selected active Tenant represented only by pseudonymous label/hash; evidence only at `C:\dcaosv1-p2-evidence` outside Git with no cloud sync or automatic deletion; fail-closed completeness and new-decision handling; unchanged `ClientUserAccess` count/hash as sole per-Client authority; future P2-B/C localhost-only posture (`127.0.0.1:5434` / `127.0.0.1:5435`) with owner-controlled resume/rollback; and P2-D reconciliation never starting Phase 3.
- Codex may implement and validate the offline foundation only. It must not create or request a real snapshot, connect to a database, mutate data, backfill, reconcile, switch, clean up, change flags/endpoint authority, or touch remote/staging/production/VPS/Tellanic.
- Phase 2 pozostaje `NOT_STARTED`.

### Aktualna Phase 3 — Scoped Authorization and Endpoint Switch

Phase 3 rozpoczyna się dopiero po osobnej decyzji dotyczącej przełączenia runtime authority, flag lub endpointów. Reconciled data nie może samo aktywować Workspace authorization.

### Aktualna Phase 4 — Legacy Cleanup

Cleanup pozostaje zabroniony do czasu stabilnej reconciliation, wygaśnięcia rollback window i osobnego owner gate.

### Phase 0 — Definition, Governance & Audit

Cel:

- skonsolidować zatwierdzone decyzje;
- utworzyć Decision Register;
- potwierdzić scope i non-goals;
- role/permissions matrix;
- state machines;
- threat model;
- data classification;
- Definition of Ready / Definition of Done;
- zmapować stan repo i legacy risks.

### Phase 0.5 — Platform Foundation

Cel:

- fundament konfiguracji i środowisk;
- worker i kolejka pg-boss;
- storage abstraction;
- SecretVault abstraction;
- audit foundation;
- feature flags;
- health/observability;
- backup/restore foundations;
- spójne kontrakty API.

### Phase 0.6 — Codebase Modularization

Finalna decyzja: timebox, tylko krytyczne hotspoty wymagane przez Phase 1:

- routing;
- auth;
- API foundation;
- `App.tsx`;
- miejsca wymagane przez Workspace isolation.

Nie wykonywać pełnego rewrite ani dzielenia wszystkich dużych plików. Reszta modularizacji przy kolejnych modułach.

### Phase 1 — Identity, Tenancy & Workspace Foundation

Docelowy zakres:

- jedna organizacja DCA;
- Workspace jako granica danych;
- typy Internal Brand / External Client;
- memberships;
- role i permissions;
- server-enforced deny-by-default;
- Client → Workspace expand/backfill/reconciliation foundation;
- audit actor/workspace context;
- workspace-scoped API/query/search foundations;
- feature flags per Workspace;
- testy izolacji.

**Status aktualny:** COMPLETE. P1.1 oraz P1.2a–P1.4a zostały ukończone; P1.2b–P1.4b zostały ukończone dla zatwierdzonego lokalnego zakresu. Szczegółowe dowody znajdują się w sekcji 24.

### Historyczny backlog A — App Shell & Global Work

- shell dla wewnętrznej pracy DCA;
- workspace switch/context;
- global work queue;
- wyszukiwanie scoped at source;
- spójne navigation, states i permissions-aware UX.

### Historyczny backlog B — Setup & Onboarding

- tworzenie Workspace przez uprawnionego Admina;
- typ Workspace;
- memberships;
- Website/Content Area setup;
- controlled credentials setup;
- brak public signup i self-service tenant creation.

### Historyczny backlog C — Requests, Briefs & Work Management

- Request intake;
- Brief lifecycle;
- Work planning i assignment;
- wersjonowanie;
- audyt;
- workflow gates.

### Historyczny backlog D — Content, Materials & AI Delivery

- Materials;
- wersje;
- production state;
- AI-assisted content;
- budżet reservations;
- pliki i media;
- human gates.

### Historyczny backlog E — Approvals & Client View

- approval state machine;
- Client View jako ograniczony widok tego samego Workspace;
- Client Manager;
- Client User;
- kontrolowana delegacja;
- non-substantive classification;
- Final Check.

### Historyczny backlog F — Websites & Direct-to-Draft

- Websites i Content Areas;
- per-Website credentials;
- WordPress contract;
- Direct-to-Draft;
- idempotency/reconciliation;
- media, blocks, alt text;
- child theme artifacts;
- draft vs publish separation.

### Historyczny backlog G — Analytics, AI Advice & Reports

- analytics source contract po rozstrzygnięciu konfliktu live GA4/GSC vs CSV;
- atomic snapshot promotion;
- AI Advice approvals;
- monthly reports;
- immutable/versioned published snapshots;
- Client View report access.

### Historyczny backlog H — Library, Finance & System

- Library/storage;
- Finance;
- AI cost ledger;
- retention queue;
- Google Shared Drive archive/export;
- Admin system surfaces;
- n8n controlled API.

### Historyczny backlog I — Legacy Consolidation

- wygaszenie starych Client/tenant/SaaS paths;
- cleanup po reconciliation;
- usunięcie nieużywanych pól dopiero po oknie obserwacji;
- legacy route/module consolidation;
- brak utrzymywania v1 i v2 jako dwóch stałych równoległych produktów.

### Historyczny backlog J — Release Hardening & Live Proofs

- pełna walidacja lokalna;
- CI;
- security verification;
- tenant/workspace isolation proof;
- restore drill;
- controlled staging rehearsal;
- live integration proofs tylko dla jawnie zatwierdzonych integracji;
- Direct-to-Draft proof;
- rollback i reconciliation proof;
- brak nierozwiązanych Critical/High.

### Historyczny backlog K — Pilot, Cutover & Operations

- migracja i reconciliation Puriva;
- feature flag Puriva;
- minimum czterotygodniowy pilot;
- pełny cykl raportowy;
- monitoring, rollback criteria i owner acceptance;
- po pomyślnym pilocie osobny staging rehearsal Internal Brands;
- kontrolowany rollout kolejnych Workspace.

---

## 19. Pilot Puriva

**Aktualizacja 19 lipca 2026:** Puriva Client Operating Pack discovery zostało przeprowadzone. Puriva pozostaje pierwszym External Client Workspace, ale nie ma jeszcze Workspace runtime authority ani production authorization.

### Finalna decyzja

Jedynym pilotem produkcyjnym DCA OS v2 jest **Puriva**.

Decyzja wcześniejsza o równoległym pilocie Internal Brand + External Client została zastąpiona.

### Czas

- minimum 4 tygodnie;
- co najmniej jeden pełny cykl raportu miesięcznego;
- pilot nie kończy się automatycznie po czasie — kończy się dopiero po spełnieniu kryteriów sukcesu.

### Zakres procesu

- Request i Brief;
- Work i Material;
- Client View;
- delegowane approvals;
- Content i AI Delivery;
- Website z blogiem jako Content Area;
- Direct-to-Draft;
- AI Advice;
- raport miesięczny;
- budżet AI;
- eksport i archiwizacja;
- GA4/GSC tylko po rozstrzygnięciu konfliktu scope opisanego w sekcji 10.

Aktualne doprecyzowania Puriva:

- dwóch Client Managers może zatwierdzać miesięczny zakres jako całość lub poszczególne elementy;
- akceptację można wycofać do momentu utworzenia draftu w WordPress;
- Client User ma wyłącznie dostęp do miesięcznych raportów;
- raport pokazuje poprzedni miesiąc, podsumowanie trzech miesięcy oraz porównanie z punktem zero;
- DCA odpowiada za przygotowanie i dostarczenie treści, a finalna ręczna publikacja External Client pozostaje operacją Admina;
- brak danych pacjentów, e-commerce, CPT i klientowskiego live analytics.

### Kryteria sukcesu

- zero naruszeń izolacji Workspace;
- 100% zgodności danych po migracji;
- pełny workflow Request → Brief → Work → Material → Approval → Deliver Draft;
- działające delegated approval;
- brak zduplikowanych draftów;
- poprawny monthly snapshot/report zgodnie z finalnym źródłem analytics;
- AI Advice przechodzi human gate;
- poprawna rezerwacja i rozliczenie budżetu AI;
- udany eksport i archiwizacja;
- brak nierozwiązanych Critical/High;
- potwierdzenie gotowości przez Admina i właściwego Workspace Managera.

### Automatyczne kryteria rollbacku

- dostęp między Workspace;
- delivery/publish bez właściwego uprawnienia;
- utrata lub nieodwracalny rozjazd danych;
- ujawnienie credentials;
- błędne naliczanie budżetu bez reconciliation;
- powtarzalne tworzenie duplikatów w systemie zewnętrznym.

### Internal Brands

Nie są częścią pierwszego pilota. Przed aktywacją wymagają osobnego staging rehearsal i testów wariantu, w którym Workspace Manager może wykonać Deliver Draft. Nie wymagają pełnego drugiego pilota produkcyjnego, jeśli Puriva przejdzie pomyślnie i wariant Internal Brand zostanie osobno zweryfikowany.

---

## 20. Rejestr zatwierdzonych decyzji ryzyka 1–25

1. **1C zabezpieczone przez 4A** — każda zmiana wersjonowana; domyślnie reapproval; tylko kontrolowane `non-substantive` przez WM/Admin z uzasadnieniem.
2. **2A** — server-side deny-by-default dla każdego zasobu i Workspace scope.
3. **3A** — migracja expand → backfill → reconciliation → switch → cleanup.
4. **4A** — kontrolowana ręczna klasyfikacja zmian.
5. **5A-Free** — envelope encryption + Docker secrets, interfejs SecretVault.
6. **6A** — Deliver Draft i Publish twardo rozdzielone.
7. **7A** — migracje expand/contract, bez destrukcyjnego rollbacku jako standardu.
8. **8A** — worker automatyzuje synchronizacje, Admin kontroluje konfigurację/manual sync/błędy; zastosowanie do Google wymaga rozstrzygnięcia konfliktu scope.
9. **9A** — Client View pokazuje wyłącznie Approved AI Advice.
10. **10A** — restore drill obowiązkowy przed produkcją.
11. **11A** — twarde human gates dla AI.
12. **12B zastąpione** — ostatecznie tylko pilot Puriva, bez równoległego Internal Brand.
13. **13A** — cutover i rollback per Workspace.
14. **14A** — automatyzacja rutyny, Admin obsługuje wyjątki.
15. **15A** — trzy kontrolowane state machines Material.
16. **16A** — staging danych i atomic promotion; źródło Google vs CSV nadal konfliktowe.
17. **17A** — uprawnienia filtrowane w źródle wyszukiwania.
18. **18A** — idempotency + reconciliation Direct-to-Draft.
19. **19A** — zamknięty snapshot i wersjonowanie raportów.
20. **20A** — atomowa rezerwacja kosztu AI przed jobem.
21. **21A** — kwarantanna i malware scanning uploadów.
22. **22A** — n8n wyłącznie przez kontrolowane API.
23. **23A** — Phase 0.6 timeboxed do krytycznych hotspotów.
24. **24A** — minimalna treść e-mail + bezpieczny link do aplikacji.
25. **25C finalnie** — pełny append-only audit bez redakcji i usuwania pojedynczych events.

---

## 21. Polityki i ich status

1. **AI budgets:** 75/90/100, hard stop, atomowa rezerwacja, Admin override z audytem.
2. **Retention:** PENDING — wcześniejsza propozycja Minimal + selektywna archiwizacja do Google Shared Drive nie jest zatwierdzoną polityką.
3. **Client approval delegation:** kontrolowana delegacja od Client Manager do Client User, ograniczona zakresem, Workspace i czasem.
4. **Pilot:** tylko Puriva, minimum 4 tygodnie i pełny cykl raportowy.

---

## 22. Decyzje zastąpione — nie przywracać

- DCA OS jako publiczny multi-tenant SaaS → zastąpione przez prywatny Agency Operations System jednej agencji.
- równoległy pilot Internal Brand + External Client → zastąpiony przez pilot tylko Puriva.
- nieograniczone zachowanie approval po zmianie → zastąpione kontrolowaną klasyfikacją `non-substantive`.
- jeden klucz szyfrujący bezpośrednio wszystkie credentials → zastąpiony envelope encryption 5A-Free.
- możliwość usuwania błędnych audit events przez Admina → zastąpiona pełnym append-only 25C.
- złożony staging/publishing roll jako domyślny model WordPress → zastąpiony Direct-to-Draft z twardym rozdziałem Draft/Publish.
- długotrwały dual-write Client + Workspace → niedozwolony; tylko krótki kontrolowany etap cutover.
- globalny cutover wszystkich Workspace → zastąpiony cutover per Workspace.
- jeden status Material → zastąpiony trzema state machines.

---

## 23. Otwarte decyzje i kwestie wymagające doprecyzowania

### Bieżące owner decisions dla Phase 2

1. **P2-01 — population:** DECIDED. Jeden aktywny lokalny Tenant oraz wszystkie jego aktywne Client, TenantMembership i ClientUserAccess, wyłącznie jako przyszły zanonimizowany offline snapshot z deterministycznym manifestem/hash.
2. **P2-02 — six no-role memberships:** DECIDED. Sześć aktywnych membershipów bez roli pozostaje wykluczonych i nietkniętych, ma klasyfikację `OWNER_REMEDIATION_REQUIRED`, nie otrzymuje roli domyślnej ani dostępu i nie powoduje zmiany danych/runtime. Jest to wyłącznie writeback dokumentacyjny.
3. **P2-03 — snapshot authority:** DECIDED. Owner supplies the anonymized offline file, selects exactly one active Tenant represented only by a pseudonymous label/hash, and Codex never creates a snapshot or accesses a database.
4. **P2-04 — completeness/anomalies:** DECIDED. Deterministic manifest/hash and complete mappings are required; unexpected absence, collision, orphan, cross-tenant link, or unknown role fails closed; new exceptions require a new owner decision.
5. **P2-05 — ClientUserAccess:** DECIDED. It remains unchanged and sole authority for per-Client visibility; count/hash must match and Workspace membership never widens access.
6. **P2-06 — backup/rollback/evidence:** DECIDED for future P2-B/C posture. Evidence remains only at `C:\dcaosv1-p2-evidence` without cloud sync or automatic deletion; localhost source/restore only, fresh backup/hash and restore rehearsal before any write, preserve evidence on failure, and owner alone decides resume/rollback.
7. **P2-07 — Phase 3 handoff:** DECIDED. P2-D reconciliation never starts Phase 3; flags remain OFF, endpoint authority remains `LOCAL_ONLY`, and Tenant/Client/ClientUserAccess remain runtime authority pending separate approval.

### Pozostały konflikt kanoniczny

8. **GA4/GSC:** późniejsza, niezatwierdzona propozycja właścicielska sugeruje live analytics dla DCA Admina, lecz bieżące dokumenty repo nadal oznaczają integrację jako `WITHDRAWN`. Wymagany osobny canonical writeback; do tego czasu brak implementacji OAuth/sync.
9. **Pełna macierz autoryzacji i state machines:** pozostaje wymagana przed szerokim kodowaniem domenowym, lecz nie blokuje owner discovery Phase 2.

### Architektura i dane

6. Docelowy schemat Workspace, Website, Content Area, Membership, Delegation, MaterialVersion, Approval, FinalCheck, Delivery, SyncRun, ReportSnapshot, AIBudgetReservation i ArchiveManifest.
7. Exact v1 → v2 mapping i reconciliation invariants.
8. Feature flag model per Workspace.
9. Audit event schema i kontrolowana allowlista pól.
10. Strategia pg-boss, retry taxonomy i dead-letter handling.
11. Storage provider, malware scanner i image pipeline.
12. Secret rotation i disaster recovery procedure.

### Produkt i UX

13. Finalna navigation/IA dla Admin, Workspace Manager, Team Member i Client View.
14. Dokładny zakres global work queue i search.
15. Pełne role/permissions w UI i API.
16. Lista `non-substantive` changes i pola zawsze invalidating approval.
17. Szczegółowy UX delegowania approval.
18. Finance visibility, waluta, export i księgowość.

### WordPress

19. Exact Direct-to-Draft contract.
20. Format komponentów/bloków oraz compatibility/versioning.
21. Child theme delivery/update/rollback process.
22. Różnica Internal Brand vs External Client w Deliver Draft.
23. Staging/production target mapping dla Puriva.

### Retencja i Google Drive

24. Firmowy Shared Drive, folder model i service identity.
25. Legal/contractual confirmation dla bezterminowego archive.
26. Archive export format, manifest schema, checksums i restore/readback procedure.
27. Obsługa data deletion requests w aktywnym systemie i archiwum.

### Pilot

28. Konkretna Puriva data migration inventory.
29. Final pilot owners, start gate i monitoring dashboard.
30. Exact rollback runbook i kryteria wznowienia po rollbacku.

---

## 24. Aktualny stan wykonania i czego nie zrobiono

- Zweryfikowany baseline `main` przed aktualizacją tego handoffu: `e4cd592c65601bd947991123df14ed2d8e8f3884` po `PR #72`; PR CI i post-merge CI PASS. Bieżący `main` należy każdorazowo sprawdzać w repozytorium.
- Phase 0, 0.5 i 0.6 są `IMPLEMENTED`.
- Phase 1 jest `COMPLETE`.
- P1.1 Workspace expand-only foundation: `PR #60`.
- P1.2a mapping dry-run: `PR #64`; P1.3a reconciliation/isolation preparation: `PR #65`; P1.4a rehearsal/evidence packet: `PR #66`.
- Lokalny P1.2b–P1.4b execution: `PR #67`, merge `55baa03d39e85819ea257127b18bc8f9094701a0`.
- Restore rehearsal `127.0.0.1:5435`, source migrations/backfill/reconciliation `127.0.0.1:5434`, idempotent rerun i endpoint permission/isolation proof: PASS.
- Utworzono 1 Workspace i 7 memberships: 1 ADMIN i 6 CLIENT_USER. Sześć membershipów bez roli pozostało wykluczonych. Client/UserAccess hashes pozostały zgodne.
- Phase 1 canonical closeout i consistency cleanup zakończono przez `PR #68` i `PR #69`.
- Phase 2 discovery zakończono przez `PR #70`; canonical P2-01 writeback zakończono przez `PR #72`.
- Phase 2 pozostaje `NOT_STARTED`; P2-A implementation-ready jest `AUTHORIZED`; P2-01 i P2-02 oraz siedem decyzji P2-A są `DECIDED`.
- Endpoint authority i feature flag pozostają `LOCAL_ONLY`.
- Nie rozpoczęto Phase 2 runtime, snapshot creation, nowego backupu, Phase 2 backfillu/reconciliation, Phase 3 switch ani cleanup; dozwolona jest wyłącznie implementacja offline P2-A bez realnego snapshotu.
- Nie dotknięto produkcji, VPS, remote staging, remote DB ani Tellanic OS.

---

## 25. Zasady pracy dla kolejnego czatu

- DCA OS i Tellanic OS są całkowicie rozdzielone.
- Repo DCA OS: `dca-glitch/dcaosv1`, lokalnie `C:\dcaosv1`.
- Aktualny kod i repo są najwyższym źródłem prawdy dla stanu implementacji.
- Wcześniejsze decyzje właścicielskie są źródłem prawdy dla intencji produktu.
- Najpierw przeczytać repo rules i kanoniczne dokumenty, potwierdzić baseline, a następnie wykonać dokładnie zatwierdzony bounded package.
- Zachować unrelated untracked files właściciela.
- Nie używać destrukcyjnych `git reset --hard`, `git clean`, szerokiego `git add .` ani `git add -A`.
- Dla komend użytkownika stosować pełne, gotowe do uruchomienia polecenia właściwe dla aktywnego środowiska Windows/WSL; nie kazać ręcznie podmieniać placeholderów.
- Nie drukować sekretów.
- Nie dotykać staging/production/VPS/remote DB bez wyraźnej osobnej zgody.
- `AUTONOMY-HIGH` pozwala Codexowi autonomicznie tworzyć branch, commit, push, PR, naprawiać CI i merge'ować po wymaganych bramkach. Deploy, produkcja/VPS, remote DB, sekrety, koszty, live integrations, destructive migrations oraz actual backfill/reconciliation/switch/cleanup nadal wymagają osobnego owner gate.
- Stabilność i kompatybilność ponad refactor purity.
- Preferować duże, spójne, bounded work packages zamiast mikrokroków.
- Praca jest wykonywana bezpośrednio przez Codex CLI, bez OpenClaw. Terra jest primary; Luna może wykonywać wyłącznie read-only review. Audyt ma być niezależny od implementacji i dotyczyć dokładnie niezmienionego diffu.
- Każda faza musi mieć własne DoR, DoD, testy, security checks, migration/reconciliation evidence i rollback notes.
- Na zakończenie każdego czatu należy zaktualizować wszystkie dokumenty kanoniczne, których dotyczyły podjęte decyzje, zmiany zakresu, nowe dowody albo wykonana praca.
- Należy aktualizować te same istniejące pliki i zachowywać ich tożsamość oraz historię wersji; nie tworzyć datowanych kopii, alternatywnych rejestrów ani równoległych „source of truth”, chyba że właściciel wyraźnie zamówi snapshot.
- Co najmniej Decision Register, nadrzędny plan faz, macierz statusu/wykonania oraz ten handoff muszą zostać sprawdzone pod kątem wymaganej aktualizacji.
- Każdy końcowy raport z czatu ma wymienić: które dokumenty kanoniczne zaktualizowano, ich nową wersję lub datę, jakie decyzje dopisano, które wcześniejsze decyzje zastąpiono oraz jakie kwestie pozostały otwarte.
- Jeśli z powodu braku dostępu nie można zaktualizować dokumentu kanonicznego, chat nie może twierdzić, że closeout jest kompletny; musi wskazać dokładny brak i przygotować jednoznaczny writeback do wykonania w następnym kroku.
- Repozytorium i dokumenty kanoniczne są autorytatywne dla stanu wykonania; ten handoff jest pełnym kontekstem właścicielskim i musi być aktualizowany bez tworzenia równoległych konkurencyjnych wersji.

---

## 26. Stan po P2-02 owner decision writeback

P2-02 jest zakończone na poziomie decyzji i dokumentacji: sześć aktywnych membershipów bez roli pozostaje wykluczonych i nietkniętych, jest sklasyfikowane jako `OWNER_REMEDIATION_REQUIRED`, nie otrzymuje roli domyślnej ani dostępu i nie powoduje zmiany danych/runtime. P2-A jest implementation-ready wyłącznie jako offline validator/consumer na owner-provided anonymized file, z siedmioma decyzjami zapisanymi powyżej. Nie ma realnego snapshotu, snapshot creation ani database access. Phase 2 runtime, backfill, reconciliation, switch, cleanup, produkcja, VPS, remote environments i Tellanic pozostają wyłączone.

---

## 27. Wiadomość otwierająca nowy chat

Skopiuj poniższy tekst i dołącz ten dokument:

> Kontynuujemy DCA OS v2 Phase 2 owner discovery, punkt po punkcie i z krótkimi wyjaśnieniami. DCA OS jest prywatnym Agency Operations System Digital Cube Agency. DCA OS i Tellanic OS są całkowicie odrębne. Przeczytaj w całości załączony canonical handoff oraz repozytoryjny raport `docs/discovery/PHASE_2_BACKFILL_RECONCILIATION_DISCOVERY_REPORT.md`.
>
> Repo: `dca-glitch/dcaosv1`. Zweryfikowany baseline przed aktualizacją handoffu: `e4cd592c65601bd947991123df14ed2d8e8f3884`, PR #72 merged, CI i post-merge CI PASS; bieżący `main` należy sprawdzić w repozytorium. Phase 1 jest COMPLETE. Phase 2 jest NOT_STARTED. P2-01 population definition jest APPROVED; P2-02 no-role disposition jest DECIDED: sześć membershipów pozostaje wykluczonych i nietkniętych jako `OWNER_REMEDIATION_REQUIRED`, bez domyślnej roli, dostępu ani zmiany danych/runtime.
>
> Najpierw autonomicznie sprawdź GitHub i aktualne dokumenty kanoniczne. P2-02 i P2-A implementation-ready są zapisane; dozwolona jest wyłącznie offline implementacja P2-A na synthetic fixtures, bez realnego snapshotu i operacji danych. Ewentualne P2-B/C, Phase 3, backfill, reconciliation, switch i cleanup wymagają osobnej owner authorization.
>
> Po każdej decyzji przygotuj docs-only canonical writeback przez Codex CLI: branch, commit, push, PR, exact-diff Terra `APPROVE_READ_ONLY`, zielone CI, merge i post-merge CI. Bez OpenClaw. Produkcja, VPS, remote DB, Tellanic, snapshot creation, database access, backfill, reconciliation, switch i cleanup pozostają wyłączone.

---

## 28. Finalny werdykt handoffu

Koncepcja oraz Phase 1 DCA OS v2 są domknięte dla zatwierdzonego lokalnego zakresu. P2-02 jest zdecydowane, a P2-A implementation-ready zapisane docs-only: sześć membershipów bez roli pozostaje wykluczonych i nietkniętych jako `OWNER_REMEDIATION_REQUIRED`, bez domyślnej roli, dostępu ani zmiany danych/runtime; dozwolona jest wyłącznie offline implementacja validator/consumer na synthetic fixtures. Phase 2 pozostaje `NOT_STARTED`; żadna część tego handoffu nie autoryzuje snapshot creation, database access, real snapshot consumption, mutation, backfillu, reconciliation, endpoint switch, cleanup, produkcji, VPS ani remote DB.

---

## 29. Historyczna aktualizacja operacyjna z 17 lipca 2026 — SUPERSEDED

Cała sekcja 29 poniżej jest zachowana wyłącznie jako historia konfiguracji. Nie jest aktualną execution authority. Plan OpenClaw został wycofany; bieżąca praca odbywa się bezpośrednio przez Codex CLI. Dokładny aktualny stan znajduje się w sekcji 30.

### Środowisko

- System właściciela: Windows.
- Repozytorium lokalne: `C:\dcaosv1`.
- Gałąź: `main`, przed konfiguracją zgodna z `origin/main`.
- Aplikacja: ChatGPT/Codex Windows `OpenAI.Codex`, pakiet `26.715.2305.0`.
- Logowanie: konto ChatGPT Pro 5x, nie API key.
- Ostatnio sprawdzony limit: 96% tygodniowego limitu pozostało; reset 24 lipca 2026 o 11:59.
- Codex CLI nie jest zainstalowany jako polecenie `codex`; aplikacja Windows działa niezależnie.

### Graphify

- Graphify zainstalowany lokalnie przez `uv tool`.
- Aktualna wersja: `graphify 0.9.17`.
- Zainstalowany wariant `graphifyy[sql]`, włącznie z `tree-sitter-sql`.
- Integracja projektowa wykonana poleceniem:
  `graphify install --project --platform codex`.
- Dodane zostały:
  - `.codex/skills/graphify/`;
  - `.codex/hooks.json` z hookiem `PreToolUse` wskazującym lokalny `graphify.EXE`;
  - pojedyncza sekcja `graphify` dopisana do istniejącego `AGENTS.md`.
- Lokalny graf został zbudowany bez API/LLM:
  - 11 276 węzłów;
  - 23 904 relacje;
  - 613 communities;
  - `graph.json` około 14,54 MB.
- `graph.html` pominięto, ponieważ graf przekracza limit 5000 węzłów; nie jest to błąd.
- `graphify-out/` jest lokalnym artefaktem generowanym i został dodany do `.gitignore`; nie należy dodawać go do Git.
- Test `graphify query` przeszedł, lecz semantyka pytań architektonicznych jest ograniczona, ponieważ użyto bezpłatnego `--code-only`; 327 dokumentów nie przeszło płatnej ekstrakcji LLM.
- Aplikacja Codex uruchomiona przed aktualizacją `PATH` nie widziała polecenia `graphify`. Zaplanowany kolejny krok: całkowicie zamknąć aplikację, także z zasobnika, uruchomić ponownie i zweryfikować dostępność Graphify.

### Projektowa konfiguracja Codexa

Codex utworzył lub zmodyfikował, bez commita:

- `.gitignore` — lokalne ignorowanie `graphify-out/`;
- `AGENTS.md` — zachowana cała wcześniejsza treść, sekcja Graphify oraz dodane reguły orchestracji i oszczędzania tokenów;
- `.codex/config.toml`;
- `.codex/agents/explorer.toml`;
- `.codex/agents/worker.toml`;
- `.codex/agents/reviewer.toml`;
- `.codex/skills/graphify/**`;
- `.codex/hooks.json`.

Przyjęty model pracy:

- jeden główny orchestrator;
- maksymalnie 3 bezpośrednich subagentów;
- `agents.max_threads = 4`;
- `agents.max_depth = 1`;
- brak rekurencyjnego delegowania;
- root bez przypiętego modelu, aby Codex dynamicznie wybierał najtańszy odpowiedni wariant;
- explorer: `gpt-5.6-terra`, low, read-only, Graphify-first;
- worker: `gpt-5.6-terra`, medium, workspace-write;
- reviewer: `gpt-5.6`, high, read-only;
- approval `on-request`, sandbox `workspace-write` w konfiguracji projektowej;
- po materialnej sesji obowiązkowa aktualizacja właściwych dokumentów kanonicznych;
- zakaz powtarzania tych samych odczytów, komend i retry bez nowej hipotezy lub zmiany stanu;
- po dwóch identycznych nieudanych próbach należy zmienić podejście;
- potwierdzone, powtarzalne rozwiązania Windows mają trafiać do runbooku.

Walidacja konfiguracji:

- TOML: PASS, 4/4;
- `git diff --check`: PASS;
- `npm.cmd run validate`: FAIL z powodu Windows `Prisma EPERM` podczas zmiany `query_engine-windows.dll.node`;
- zgodnie z zasadami smoke nie został uruchomiony.

Prawdopodobna przyczyna `Prisma EPERM`: DLL jest zablokowany przez działający proces Node/Prisma albo inny proces korzystający z repozytorium. Nie rozwiązano jeszcze tego problemu. Nie należy bez zgody zabijać wszystkich procesów Node, ponieważ mogą należeć do innych projektów. Następny chat powinien najpierw zidentyfikować proces trzymający plik, a następnie wykonać minimalne, bezpieczne zatrzymanie tylko właściwego procesu i ponowić walidację jeden raz.

Aktualny oczekiwany `git status --short`:

```text
 M .gitignore
 M AGENTS.md
?? .codex/
```

Nie wykonano commit, push, PR ani deploy.

### Tryb uprawnień aplikacji

W UI dostępne są `Ask for approval`, `Approve for me` i `Full access`.

- Rekomendowany domyślny tryb: `Approve for me` albo `Ask for approval`.
- `Full access` jest świadomym wyborem właściciela, ale nie jest wymagany dla DCA OS i zwiększa ryzyko modyfikacji plików poza repozytorium, dostępu do internetu i operacji bez potwierdzenia.
- Live override w UI może nadpisać `.codex/config.toml`.

### Plan OpenClaw

Właściciel zatwierdził docelową koncepcję, ale OpenClaw nie został jeszcze zainstalowany.

Docelowa architektura operacyjna:

```text
Właściciel
  -> OpenClaw jako jedyny nadrzędny orchestrator
       -> Codex app-server jako executor repozytorium
       -> lokalne deterministyczne skrypty dla znanych problemów Windows
       -> reviewer/subagent dla trudniejszych decyzji
```

Założenia:

- OpenClaw ma korzystać z subskrypcji Codex przez OAuth, nie z API key, jeśli oficjalna integracja nadal to wspiera w momencie instalacji.
- OpenClaw ma przejąć rutynowe decyzje, retry, analizę znanych błędów Windows i eskalować do właściciela tylko operacje destrukcyjne, produkcyjne, finansowe, związane z sekretami lub rzeczywiście niejednoznaczne.
- Znane błędy najpierw obsługują deterministyczne reguły/skrypty bez modelu; następnie tani model; maksymalnie dwie takie same próby; potem reviewer lub właściciel.
- OpenClaw nie może komunikować się z tą konkretną rozmową ChatGPT jako tą samą sesją. Wspólną pamięcią pozostają repozytorium, dokumenty kanoniczne, Decision Register i runbook.
- OpenClaw ma zostać zainstalowany dopiero po domknięciu i zweryfikowaniu minimalnej konfiguracji Codexa.

### Dokładny następny krok

1. Ponownie uruchomić aplikację Codex po aktualizacji `PATH`.
2. W projekcie `C:\dcaosv1` sprawdzić dostępność `graphify --version` oraz wykonać jedno małe `graphify query`.
3. Sprawdzić rzeczywistą treść diffów `AGENTS.md`, `.codex/config.toml` i agentów; nie polegać wyłącznie na raporcie agenta.
4. Zidentyfikować proces blokujący Prisma DLL bez szerokiego zatrzymywania wszystkich procesów.
5. Ponowić `npm.cmd run validate` dokładnie raz po usunięciu blokady; smoke tylko po PASS.
6. Jeśli walidacja przejdzie, przygotować świadomy commit wyłącznie konfiguracji Codex/Graphify.
7. Następnie rozpocząć osobną, kontrolowaną instalację OpenClaw na Windows.
8. Dopiero po pełnym teście orchestratora wrócić do gate przed Fazą 1 DCA OS v2.

---

## 30. Aktualny stan operacyjny — 19 lipca 2026

### Repo i baseline

- repo: `dca-glitch/dcaosv1`;
- zweryfikowany baseline przed aktualizacją handoffu: `e4cd592c65601bd947991123df14ed2d8e8f3884`; bieżący `main` należy sprawdzać w repozytorium;
- `PR #72`: merged;
- PR CI i post-merge main CI: PASS;
- Phase 1: COMPLETE;
- Phase 2: NOT_STARTED;
- owner decisions: P2-A implementation-ready authorized; remaining execution gates owner-gated;
- P2-01: APPROVED;
- P2-02: DECIDED — six no-role memberships remain excluded/untouched as `OWNER_REMEDIATION_REQUIRED`, with no default role, access, or data/runtime change.
- P2-A: IMPLEMENTATION_READY_AUTHORIZED — offline validator/consumer only; owner-provided anonymized file, external evidence, fail-closed checks, unchanged `ClientUserAccess`, localhost-only future P2-B/C posture, and no Phase 3 start.

### Codex i model pracy

- praca odbywa się bezpośrednio przez Codex CLI, bez OpenClaw;
- logowanie używa konta ChatGPT, nie API key;
- Terra jest primary;
- Luna może wykonywać wyłącznie read-only review;
- `AUTONOMY-HIGH` pozwala na autonomiczne branch, commit, push, PR, CI repair i merge po bramkach;
- materialny diff wymaga exact-diff Terra `APPROVE_READ_ONLY`, walidacji i zielonego CI;
- produkcja/VPS, remote DB, sekrety, koszty, destructive migrations, live integrations, actual backfill/reconciliation/switch/cleanup i Tellanic pozostają owner-gated.

### Windows runner

Powtarzalny błąd `CreateProcessAsUserW: Access denied` został usunięty przez pozostawienie jednej sekcji `[windows]` w globalnym `config.toml` i ustawienie:

```toml
[windows]
sandbox = "unelevated"
```

Po restarcie Codex polecenia `Get-Date`, `whoami`, `git`, `node`, `git status` i `git rev-parse HEAD` przeszły. Nie należy zmieniać kodu repo w celu obejścia awarii runnera. Przy ponownym wystąpieniu błędu najpierw sprawdzić prosty preflight i stan sandboxa.

### Prisma i Windows tooling

- nie uruchamiać Prisma przez zagnieżdżony `child_process`, `cmd.exe`, `npm.cmd` ani `npx.cmd` w skryptach orchestration;
- gdy wymagane, uruchamiać Prisma CLI bezpośrednio przez Node;
- dokumenty edytować precyzyjnie przez `apply_patch`, bez masowych rewrite;
- po dwóch identycznych nieudanych próbach zmienić hipotezę lub podejście;
- potwierdzone rozwiązania Windows utrwalać w operator runbooku.

### Graphify

Repo zawiera Graphify-first guidance i wcześniejszą konfigurację Graphify `0.9.17`. Dostępność binarki, hooków i grafu należy potwierdzić na aktywnej maszynie; historyczne liczby grafu z sekcji 29 nie są bieżącą bramką Phase 2.

### Aktualny następny krok

1. Zaimplementować i zweryfikować wyłącznie offline P2-A na synthetic fixtures; nie tworzyć ani konsumować realnego snapshotu.
2. Zachować `ClientUserAccess` jako sole per-Client authority i nie wykonywać żadnej operacji danych.
3. Zweryfikować GitHub `main` i aktualne dokumenty przed każdą przyszłą misją; nie rozpoczynać P2-B/C, Phase 3, backfill, reconciliation, switch ani cleanup bez osobnej owner authorization.

### Safety flags

```text
PHASE_1=COMPLETE
PHASE_2=NOT_STARTED
OWNER_DECISIONS=IN_PROGRESS
P2_01_POPULATION=APPROVED
P2_02_NO_ROLE_DISPOSITION=DECIDED
P2_A_IMPLEMENTATION_READY=AUTHORIZED
PHASE_2_DATA_MUTATION=NO
PHASE_2_BACKFILL_EXECUTED=NO
PHASE_2_RECONCILIATION_EXECUTED=NO
WORKSPACE_AUTHORITY_CHANGED_IN_PHASE_2=NO
FEATURE_FLAGS_CHANGED_IN_PHASE_2=NO
PRODUCTION_VPS_TOUCHED=NO
REMOTE_DATABASE_TOUCHED=NO
TELLANIC_TOUCHED=NO
```
