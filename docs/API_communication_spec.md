# Front-End API layer megvalósítása AGENT segítségével
Az alábbi fejlesztési tervet és célokat saját magam határoztam meg.
Az AI (ChatGPT) segített lehetséges döntések és példák megmutatásában, de az alap ötletek és a döntések az én kezemben voltak.

**A logika, érdemi rész 80%-a az enyém, 20%-a az AI-é.**

A megvalósításhoz a KIRO Student-et használtam az alábbiak sezrint:
Plan fázisban adtam oda neki ezt a specifikációt, AUTO modell választással.
Majd amikor a Plan összeált akkor a Cloude Opus 5.5 modellre bíztam a megvalósítást.
Az [IMPLEMENTATION-ben](./api_communication_implementation.md) olvasható a megvalósítás részletessége.

## Fejlesztési keretek
- Olvassa el az érintett endpointok JSON-dokumentációját és vizsgálja meg a releváns backend-kódot, ha szükséges.
- Ezek alapján döntse el, hogyan definiálja a nyers API-válaszok típusait és futásidejű validációját.
- A validáció ellenőrizze a szükséges mezőket, azok típusát és a feldolgozáshoz szükséges szerkezeti összefüggéseket.
- Ne következtessen ki önkényesen mezőket, típusokat vagy üzleti szabályokat, amelyekre nincs bizonyíték a dokumentációban vagy a tényleges válaszokban.
- Ha a dokumentáció hiányos vagy ellentmondásos, jelezze a bizonytalanságot, és kérjen döntést, mielőtt olyan feltételezést építene be, amely megváltoztatja a backend és frontend közötti szerződést.
- A véglegesített megoldást dokumentálja, és írjon teszteket az érvénytelen válaszokra is.

## lehetséges API hívások back-end felé

/exchange-rates/pages
paramterers: nincs paramétere
Válasz: az elérhető DIM táblák egy része ami a szűrők adatait adják meg, valamint amiből a többi API kérés paraméterei felépülnek.

{
  "DimAuthors": [
    {
      "AuthorID": 1,
      "AuthorName": "UNKNOWN"
    },
    {}
    ],
      "DimCategories": [
    {
      "CategoryID": 19,
      "CategoryName": "Artificial Intelligence"
    },
    {}
    ],
    "DimCurrencies": [
    {
      "CurrencyID": 1,
      "CurrencyCode": "ADP",
      "CurrencyName": "Andorran Peseta",
      "CurrencySymbol": "ADP"
    },
    {}
    ],
    "DimSources": [
    {
      "SourceID": 24,
      "SourceName": "/FILM"
    },
    {}
    ]
}

/exchange-rates/pages/FX_performance
paramterers: 
BaseCurrency: string, TargetCurrency: string - Beállítja a keresett árfolyamhoz a valuta párt
optional paramteres: StartDate: string | null, ToDate: string | null - Beállítja a keresett árfolyam idősávját, ha mindkettű null akkor az összes elérhető adatot kéri, ha StartDate null akkor ToDate-ig adja meg inkluzivan, ha ToDate null akkor pedig StartDate-től adja meg inkluzivan.
Válasz: fx_performance oldalhoz szükséges adatok 

Példa szűrőkkel való lekérdezés
http://localhost:8000/exchange-rates/pages/FX_performance?BaseCurrency=USD&TargetCurrency=HUF&StartDate=2026-08-01&ToDate=2026-10-01

[fx_performance_JSON](./fx_performance_JSON.md)

#### query key
Ez egy példa az API használatára, aminek a használatára front-endnek jelenleg nem lesz szüksége:
["FX_performance", {
  BaseCurrency: "USD",
  TargetCurrency: "HUF",
  StartDate: "2026-08-01",
  ToDate: "2026-10-01"
}]

Ez az általános felhasználása a jelenlegi Front-End tervvel: maga az fx_performance oldal a szűrő típusa miatt a ToDate mindig null lesz
["FX_performance", {
  BaseCurrency: "USD",
  TargetCurrency: "HUF",
  StartDate: "2026-08-01",
  ToDate: null
}]

/exchange-rates/pages/Daily_heatmap
paramterers: 
optional paramteres: Currencies: array<string> | null - megadja a heatmap oszlopaihoz tartozó valutákat, ha null akkor a teljes heatmap-et vissza adja, ami kb 230*230-as táblázatot/mátrixot jelent.
Válasz: Daily_heatmap oldalhoz szükséges adatok 

Szűrők nélkül
http://localhost:8000/exchange-rates/pages/Daily_heatmap

Szűrőkkel
http://localhost:8000/exchange-rates/pages/Daily_heatmap?Currencies=HUF&Currencies=USD&Currencies=EUR

[daily_heatmap_JSON](./daily_heatmap_JSON.md)

#### query key
["Daily_heatmap", {
  Currencies: ["HUF","USD","EUR"]
}]

/exchange-rates/pages/Media_analytics
paramterers: StartDate: string, ToDate: string - kezdő és vég dátum a mádiumok fő szűrésére
optional paramteres: 
SourceFilter: string | null, - kereszt szűrésekhez, ha Source alapján szűrjük a híreket
CategoryFilter: string | null, - kereszt szűrésekhez, ha Category alapján szűrjük a híreket
IncludeMain: boolean default value = true - ha szűrűnk, akkor ez false, hogy ne adja vissza a mainData-t, csak a szűrtet. Ez segít a JSON feldolgozásban és sebességben
Válasz: Media_analytics oldalhoz szükséges adatok 

Kötelező szűrők, main data lekérdezése
http://localhost:8000/exchange-rates/pages/Media_analytics?StartDate=2026-08-01&ToDate=2026-10-01&IncludeMain=true
[media_analytics_JSON](./media_analytics_JSON.md)
#### query key
["Media_analytics", {
  StartDate: "2026-08-01",
  ToDate: "2026-10-01"
  SourceFilter: null,
  CategoryFilter: null,
  IncludeMain: true
}]

Kereszt szűrés data lekérdezése, main data üres
http://localhost:8000/exchange-rates/pages/Media_analytics?StartDate=2026-08-01&ToDate=2026-10-01&SourceFilter=YAHOO%20ENTERTAINMENT&IncludeMain=false

[filtered_media_analytics_JSON](./filtered_media_analytics_JSON.md)

#### query key
["Media_analytics", {
  StartDate: "2026-08-01",
  ToDate: "2026-10-01"
  SourceFilter: "YAHOO ENTERTAINMENT",
  CategoryFilter: null,
  IncludeMain: false
}]

## működési alapelvek
Elkészül egy oldal adatai, meg vannak jelenítve.
Ha a user ellép az oldalról akkor azon lévő Szűrők és megjelnített adatok ne vesszenek el, vissza lépés esetén töltődjön vissza, vagy maradjon meg az adat a tárban.
Cél: oldalak között lépkedve is megmaradjanak az adatok.

API request befejezése a háttérben, hosszabb futamidejő requestekhez.
Ha egy API request elindult a háttérben, de a user közben lelép az oldalról akkor a request ne álljon meg, a háttérben legyen feldolgozva és elmentve helyesen az oldal tárjába hogy meg lehessen nézni mire visszalép a user. 
Probléma amit felvethet és külön kell kezelni: ha a user sok keresztszűrőt vagy szűrőt alkalmaz éppen, akkor ne induljon egyszerre 1000 api request, erre a problémára megoldást kell keresni. (AI ajánlása: A sok gyors szűrőváltozás ellen inkább debounce-ot vagy más, tudatos kérésindítási szabályt használj. Ha a backend terhelése miatt valóban korlátozni kell a párhuzamos kéréseket, azt külön követelményként kell megfogalmazni.)
Cél: API hívás elkezdése > Másik oldal betöltése ne zavarja meg az API futását és JSON feldolgozását > háttérben adatok feldolgozódnak > visszalép az oldalra: ha nincs még adat akkor loading, ha már betöltődött az adat akkor megjelnítés.

### Megoldási ötlet
TanStack Query használata.
NINCSENEK közös szűről oldalak között, mindegyik oldanak egyedi szűrői vannak, még akkor is ha ugyan azt a típusú adatokat kezelik az összekeverődés elkerülése érdekében.

Fontos, hogy a szűrők alatt a szűrésre használt adatot értjük, nem a szűrő komponenseket.

Szűrők és oldalak adatai az oldalaktól külön tárolódnak, hogy ha elveszti a fókuszt az adatok ne vesszenek el, csak be kelljen tölteni ha az oldal újra fókuszba kerül/újra létrejön.

### Front-end betöltése esetén
/exchange-rates/pages
1. Lefut a legelső API call, ami a szűrőkhöz szükséges adatokat dolgozza fel. 
2. Feldolgozzuk a JSON-t
3. Eltároljuk a szűrők lehetséges adatait a már megbeszélt közös tárban.
4. Ha létre kell hozni egy oldal szűrő komponensét innen kap adatokat. 

Sikertelen lefutás esetén az oldal tájékoztatja a User-t, hogy betöltődési hibával találkozott, az alap szűrő adatok nem töltődtek be. F5 újrapróbálja, újra indítja az API kérést. A pop-up ablakon legyen egy Re-try gomb, ami újra próbálja hívni a szűrő adatokat. Addig amíg ezek az adatok nem érkeznek meg ne lehessen használni az oldalt, ezek nélkül az oldalak nagyon nagy része nem működne és az API kéréseket sem lehetne felépíteni.

A felhasználó láthatja az oldalakat, ha a dimenzióadatok már megvannak, de egy oldal saját API-kérése még folyamatban van.
Az oldalak ne várjanak egymás API-kéréseire.

### API réteg feladata
A grafikonok, kártyák és szűrőkomponensek konkrét adatbetöltése az oldalaknak kimarad ebből a dokumentumból.

Az API-réteg feladata:
1.Az API-réteg lekéri és szükség esetén futásidőben ellenőrzi a választ.
2.Egy endpoint-specifikus feldolgozó függvény előállítja a típusos, megjelenítésre előkészített adatstruktúrát.
3.A TanStack Query ezt a feldolgozott struktúrát cache-eli.
4.Az oldal a cache-ből kapott adatot megjeleníti; nem végzi el újra az egész feldolgozást.

### futásidejű ellenőrzés
A jelenlegi stack felhasználásával, ha lehetséges, ha nem akkor ezt jelezd és importáljunk egy új csomagot/libraryt.
Az API-rétegben endpointonként külön validátorok legyenek, a közös, általános ellenőrzéseket pedig újra lehessen használni.

Fontos tervezési szabály: az Axios generikus típusparamétere, például az axios.get<FxApiResponse>(), önmagában nem validálja a szerver válaszát. Ezért a hálózati adatot kezdetben unknown típusként kell kezelni, és csak sikeres ellenőrzés után szabad a konkrét típusra szűkíteni.

### API request-ek futtatása
Az alábbi a jelenlegi tervem, ez még nem érinti az oldalakon belüli működést.
1. Változik egy szűrő adata az oldalon USER hatására, amire változik a tényleges eltárolt jelenlegi szűrő is(erre tudom hogy lehetséges HOOK alapú megoldást írni, ha van hatékonyabb megoldás a tech stack-ben használjuk azt)
2. A szerverlekérdezés csak akkor induljon el, ha a szűrőváltozások rövid ideig abbamaradtak — ezt debounce-zal lehet megoldani.
3. API request előállítása
4. API request indítása
5. JSON válasz feldolgozása
6. Adatok betöltése a szükséges tárakba, a tárakban olyan formában van amiket az oldal könnyen kitud olvasni.
7.1 Változik a tárban lévő adat > újra renderelődik a grafikon vagy a hozzá tartozó megjelnítés
7.2 Ha megnyitunk egy oldalt amihez van már adat akkor az renderelődik ki azonnal.

Extra infók:
A query key mindig a ténylegesen lekérdezett paramétereket tartalmazza.
Az oldalváltás önmagában ne törölje a cache-t és ne szakítsa meg automatikusan a kérést.
A régi, más szűrőkhöz tartozó eredmény soha ne jelenjen meg az új szűrők eredményeként.
Az azonos query key-hez tartozó párhuzamos kérések deduplikálását a TanStack Query végezze.
A debounce időtartamát nem szükséges most véglegesen meghatározni; az elfogadási tesztek és a későbbi használhatósági ellenőrzés alapján beállítható. Használj olyan időt először amit ennél az applikációnál megfelelőnek ítélsz.

példa:
1. A felhasználó az FX Performance oldalon kiválasztja az USD/HUF párt, és elindul az API-kérés.
2. Átlép a Daily Heatmap oldalra.
3. Az FX Performance kérése közben befejeződik, és az eredmény bekerül az FX Performance cache-ébe.
4. Visszatér az FX Performance oldalra, ahol az eredmény már megjeleníthető.

Oldal újratöltése alatt az alkalmazáson belüli navigációra gondolok. LocalStorage-el jelenleg nem kell foglalkozni.

#### Fő és Szűrt adatok kezelése MediaAnalytics oldalon az alábbi esetben
1. a fő adatok már megvannak;
2. a felhasználó egy oszlopra kattint;
3. elindul a szűrt API-kérés;
4. közben a felhasználó egy másik oszlopra kattint.

A `mainData` és a szűrt adatok külön API-válaszok.

- A `mainData` mindig aktív marad és megjelenik.
- Egyszerre legfeljebb egy `filteredData` lehet aktív és megjelenítve.
- Új szűrt lekérdezés indításakor az új lekérdezés veszi át a szűrt adat aktív szerepét. A korábbi, már nem használt `filteredData` törlendő.
- Ha egy szűrt lekérdezés elindult, azt az oldalváltás vagy egy újabb szűrés nem szakítja meg automatikusan. A később beérkező válasz azonban csak akkor válhat aktívvá, ha az adott lekérdezés továbbra is a legutóbb elküldött szűrés.
- Ha új `mainData` érkezik és korábban létezett `filteredData`, a `filteredData` törlendő. Az új `mainData` lesz az egyetlen megmaradó aktív oldaladat.

Így a `mainData` mellett legfeljebb egy `filteredData` jelenhet meg, és egy korábbi szűrés később befejeződő válasza sem írhatja felül a legújabb szűrés eredményét.

#### API request-ek összeállítása
A Currencies paraméter tömbjét a kérés összeállításakor is helyesen kell szerializálni, például ismétlődő query paraméterekként: ?Currencies=HUF&Currencies=USD&Currencies=EUR
Ezt érdemes az API-rétegben központilag megoldani, nem minden oldalon külön.

fx_performance ToDate szűrője mindig null az API kérések elkészítésekor, az oldalon található szűrő komponens típusa miatt.

Olyan eset nem fordulhat elő, ahol létezik a Currencies paraméter, de üres a DailyHeatmap esetében, mivel a front-end oldal majd a kiválasztott Currency kódokat fogja oda adni szűrőnek, vagy semmit. Így az API layer tudja, hogy hogyan kell össze állítani a property-t.

MediaAnalytics kereszt szűrésnél nem lehetséges egyszerre Source és Category szűrés. Majd onClick-re változtatja meg a szűrőt az oldal, amire új API kérés jön létre. És egyszerre egy kategóriára és source-ra nem lehetséges kattintani.

IncludeMain= false: akkor csak a szűrt adatokat kapjuk.
IncludeMain= true: minden adatot, DE általában ha true akkor nem lesz szűrt adat sem, mivel csak a main adatot lehet szűrést végezni ez FONTOS! Ha van szűrő, akkor kellett már lennie mainData-nak amin szűrni akar a user. 

Dátumok alapértékei: fx_performance esetében az elmúlt X nap/hét/hónap/év típusú szűrőt fogunk alkalmazni, ezzel szerintem nem lehetséges, hogy ne legyen, vagy üres legyen az egyik date.
media_analytics esetén pedig két dátum közötti szűrőt fogunk alkalmazni, amikenk lesz előre beállított alap értékük emiatt ha bármelyik (StartDate vagy ToDate) változik biztosan lesz mindkét értékhez adat.

#### Mikor szakítunk meg egy API kérést?
Nem feltétlenül szakítjuk meg a már elindult régi kéréseket. A kérés a háttérben befejeződhet, de a hozzá tartozó eredmény csak akkor tárolható el és jeleníthető meg, ha a lekérdezés továbbra is az aktuális aktív szerephez tartozik. A már nem használt, befejezett eredményeket nem őrizzük meg.

A specifikáció alapelve:
- Oldalváltás: önmagában ne szakítsa meg a futó kérést.
- Szűrőváltozás: az új szűrők új query key-t eredményezzenek.
- Azonos query key-hez tartozó ismételt kérés: a TanStack Query kezelje a deduplikációt.
- Új aktív lekérdezés: a korábbi, már nem használt befejezett eredmény törlendő.
- Elavult kérés: a megszakítás opcionális, de a későbbi válasza nem teheti újra aktívvá a korábbi eredményt.

### közös tár ötlet.
A „közös tár” a specifikációban inkább az oldalaktól független adatkezelést jelentse, ne feltétlenül egyetlen saját adattároló implementációját.

Oldalak által használt szűrők lehetséges adatai.
Filter_Currencies
Filter_Sources
Filter_Categories

#### TanStack Query cache szabályok
A cache csak az aktív, megjelenítéshez szükséges sikeres eredményeket őrzi. A már nem használt, befejezett eredményeket az új lekérdezés aktívvá válásakor azonnal törölni kell; ezért ezekhez nem szükséges külön időalapú cache-törlés vagy inaktív eredményekre vonatkozó darabszámkorlát.

- Daily Heatmap: egy aktív eredmény.
- FX Performance: egy aktív eredmény.
- Media Analytics: egy aktív `mainData` és legfeljebb egy aktív `filteredData`, tehát legfeljebb két aktív eredmény.

Új szűrés esetén az új lekérdezés veszi át az adott oldal vagy adatszerep aktív szerepét, a korábbi aktív eredmény pedig törlendő. Az aktív eredmények nem idő alapján járnak le, és az oldalváltás önmagában nem törli vagy frissíti őket. A cache-ben lévő aktív adat visszatéréskor azonnal felhasználható.

Sikertelen lekérdezés vagy feldolgozás esetén hibás vagy részleges adat nem kerülhet a sikeres adatok közé. Ha egy korábban sikeres, ugyanahhoz az aktív adathoz tartozó újralekérdezés sikertelen, a korábbi sikeres adat megmaradhat, a felület pedig ettől függetlenül jelezze a hibát. Szűrőváltáskor azonban a már nem aktuális eredmény nem tartható meg új aktív eredményként.

Az új modell előnye az egyszerűbb és kiszámíthatóbb memóriahasználat. Hátránya, hogy A → B → A szűrés esetén az első A eredményét újra le kell kérni, ha közben töröltük.

Sikertelen első lekérés esetén ne kerüljön hibás vagy részleges adat a sikeres adatok cache-ébe.
Sikertelen újralekérés esetén a korábbi sikeres adat maradjon meg, ha rendelkezésre áll.
A hibaállapotot ettől függetlenül jelezze a felület.

#### Oldalankénti szűrő adatok, javasolt megoldás: Oldalaktól elkülönített állapot, amiért a szülő felelhet. Nem szükséges új könyvtár bevezetése, a legegyszerűbb megoldás is működhet. 
(fx_performance ToDate szűrője mindig null az API kérések elkészítésekor, az oldalon található szűrő komponens typusa miatt.)
fx_performance_BaseCurrency
fx_performance_TargetCurrency
fx_performance_StartDate
daily_heatmap_currencies
media_analytics_StartDate
media_analytics_ToDate
media_analytics_Source
media_analytics_Category

#### Megjelnítendő adatok, javasolt megoldás: TanStack Query cache

type FxPerformanceData = {
    kpi:{
        previousDayRate: number | null; 
        changeSinceYesterday: number | null; 
        todaysRate: number | null; 
        firstRateInPeriod: number | null; 
        changeSincePeriod: number | null; 
    };
    charts:{
        lineChart_X: string [] | null;
        lineChart_Y_data: number[] | null;
        waterfallVarianceChart_X: string[] | null;
        waterfallVarianceChart_Y_data: number[] | null;
    };
};

Currency-sorrend: A sorrend határozza meg az oszlopok sorrendjét is, a válaszban:
"x_data": ["HUF","USD","EUR"], azt jelenti, hogy első oszlop a HUF és ahhoz az oszlophoz tartozó adatok, a majd feldolgozott mátrix első oszlopának adatai lesznek.

type DailyHeatmapData = {
    kpi:{
        currentDay: string | null; 
    };
    charts:{
        X_FilterCurrencies: string [] | null;
        Y_AllCurrencies: string [] | null;
        matrics_data: (number | null)[][];
    };
};

type MediaAnalyticsData= {
    charts:{
        tableData: (string | null)[][];
        categoriesName: string [] | null;
        categoriesData: number [] | null;
        sourcesName: string[] | null;
        sourcesData: number[] | null;
    };
};

Egyéb szabályok:
Az FX Performance X- és Y-tömbjeinek hossza egyezzen meg.
A Daily Heatmap X_FilterCurrencies sorrendje egyezzen azzal a sorrenddel, amelyhez a mátrix oszlopai tartoznak.
A Y_AllCurrencies sorrendjének a mátrix sorainak sorrendjét kell meghatároznia.
A Media Analytics categoriesName és categoriesData, illetve sourcesName és sourcesData tömbjeinek elemenként összetartozó értékeket kell tartalmazniuk.
A null és az üres tömb jelentése ne keveredjen: az előbbi jelentheti az érték hiányát, az utóbbi pedig azt, hogy nincs megjeleníthető elem. Lehetséges egy tömbben az hogy nincs megjelenítendő elem, azt üresen kéne hagyja pl a heatmap.

#### Betöltési és Hibaállapotok, javasolt megoldás: TanStack Query állapota
Folyamatban lévő kérés, hibaüzenet.
Ezt rád bízom a tudatott kereteket betartva!

## Javasolt elfogadási tesztcsoportok
Ez még a tesztterv vázlata, nem a végleges tesztspecifikáció.
[ ] Navigáció és cache

Az FX Performance kérés elindul, a felhasználó másik oldalra lép, a kérés befejeződik, majd visszatéréskor a korábban betöltött adat megjelenik.

[ ] Szűrőállapot megőrzése

Az oldal elhagyása és újbóli megnyitása után a kiválasztott szűrőértékek változatlanok.

[ ] Eltérő query key-k

Az USD/HUF és EUR/HUF eredményei külön cache-bejegyzésben maradnak, és nem keverednek össze.

[ ] Gyors szűrőváltozás

Több gyors szűrőváltozás esetén a megadott debounce-szabály szerint indulnak a kérések, és az aktuális szűrők eredménye jelenik meg.

[ ] Keresztszűrés

A Media Analytics fő és kereszt-szűrt adatai az IncludeMain értékének megfelelően, külön query key alatt tárolódnak.

[ ] Dimenzióadatok hibája

Sikertelen dimenziólekérdezés esetén hibaüzenet és újrapróbálási lehetőség jelenik meg.

[ ] Adatfeldolgozás

A cache-ben a meghatározott feldolgozott struktúra található, és oldalváltáskor nem történik meg ismét a teljes feldolgozás.

[ ] Aktív eredmény megőrzése

Az FX Performance és a Daily Heatmap egyszerre legfeljebb egy aktív eredményt őriz. Új lekérdezés aktívvá válásakor a korábbi, már nem használt befejezett eredmény törlődik, az új adat pedig az oldalra visszatérve azonnal megjeleníthető.

[ ] Tesztcsoport	
Ellenőrizendő viselkedés

[ ] Futásidejű validálás	
Hibás adattípus vagy hiányzó kötelező mező esetén a feldolgozás meghiúsul, és nem kerül hibás adat a cache-be.

[ ] Feldolgozási hiba	
A feldolgozó függvény hibája lekérdezési hibaként kezelődik.

[ ] Aktív eredmény cseréje	
Új szűrés esetén az új lekérdezés veszi át az aktív szerepet, a korábbi befejezett eredmény törlődik, és a korábbi eredmény nem jelenik meg az új szűréshez tartozó adatként.

[ ] A → B → A szűrés	
Ha az A eredményét a B lekérdezés aktívvá válásakor töröltük, az A → B → A változás új A lekérdezést indít, és az új A eredménye jelenik meg.

[ ] Régi adat és frissítési hiba	
Sikertelen újralekérdezés esetén a korábbi sikeres adat a meghatározott szabályok szerint megmarad.

[ ] Heatmap tengelyei	
A cellák a megfelelő valutapárhoz tartoznak, a kiválasztott valuták sorrendje nem keveredik össze.

[ ] Media Analytics versengő kérései	
Egy korábbi szűrőhöz tartozó később befejeződő kérés sem jelenhet meg az új szűrés eredményeként. A `mainData` megmarad aktívnak, az új szűrt eredmény lecseréli a korábbi `filteredData`-t, és új `mainData` érkezésekor a `filteredData` törlődik.