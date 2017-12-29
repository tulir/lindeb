## Viikko 1
1. [x] Valitse harjoitustyösi aihe (katso aihe-ehdotukset, jos aiheen valinta tuottaa vaikeuksia). (0,5p)
   * [x] Pystytä versionhallinta. (0,5p)
   * [x] Luo repositorio GitHubiin, ja lisää README.md-tiedostoon aiheesi kuvaus tai linkki valmiiseen aiheeseen, linkki sovellukseesi ja linkki dokumentaatioosi (linkki kansiossa doc sijaitsevaan pdf-tiedostoon).
   * [x] Salli Issuet repositoriastasi
2. [x] Dokumentoi perusasiat doc-kansioon yhteen pdf-tiedostoon. (1p)
   * [x] Lisää johdanto
   * [x] Lisää käyttötapaukset
3. [x] Pystytä työympäristö. (1p)
   * [ ] ~~Ota PHP-tuki käyttöön~~
   * [x] Ota ~~PostgreSQL~~**MariaDB**-tietokantapalvelin käyttöön
   * [x] Luo SSH-avain
4. [x] Rekisteröidy labtooliin. Valitse kurssiksi Tsoha2017-joulu.

## Viikko 2
1. [ ] Suunnittele käyttöliittymäsi ja toteuta **ne** ~~niistä staattiset HTML-sivut~~. Muista lisätä linkit toteuttamiisi sivuihin reposi README.md-tiedostoon. (1,5p)
   * [x] Suunnittele etusivu
   * [ ] Suunnittele kaikki listaussivut
   * [ ] Suunnittele kaikki muokkaus- ja esittelysivut
2. [x] Ota tietokanta käyttöön ja dokumentoi se. (1,5p)
   * [x] Lisää dokumentaatioon järjestelmän tietosisältö osio ja relaatiotietokantakaavio
   * [x] Lisää tietokantataulujen pystytyslauseet create_tables.sql-tiedostoon. Pystytä näillä taulut tietokantaan.
   * [x] Lisää tietokantataulujen poistolauseet drop_tables.sql-tiedostoon
   * [x] Lisää testidatan lisäyslauseet add_test_data.sql-tiedostoon. ~~Aja testidata tietokantaan.~~

## Viikko 3
1. [x] Toteuta sovellukseesi vähintään yksi malliluokka, jossa on kaikki tietokohteen oliot tietokannasta hakeva metodi (esim. all), tietyllä id:llä varustetun tietokohteen olion tietokannasta hakeva metodi (esim. find) ja tietokohteen olion tietokantaan lisäävä metodi (esim. save). (1,5p)
2. [x] Toteuta malliasi käyttämään kontrolleriin metodit, jotka esittävät tietokohteen listaus-, esittely- ja lisäysnäkymän. Toteuta myös kontrolleriisi metodi, joka mahdollistaa tietokohteen olion lisäämisen tietokantaan käyttäjän lähettämän lomakkeen tiedoilla. (1,5p)
3. [ ] Kirjoita koodikatselmointi (vapaaehtoinen). (0-2p)

## Viikko 4
1. [x] Lisää malliluokkaasi metodi tietokohteen olion muokkaamiselle (esim. update)- ja poistolle (esim. destroy). (1p)
2. [ ] Lisää käyttäjälle mahdollisuus muokkaukseen ja poistoon lisäämällä kontrolleriin tarvittavat medotit ja toteuttamalla tarvittavat näkymät. Muokkausnäkymä on luultavasti lisäysnäkymää muistuttava lomake ja poisto voi tapahtua painiketta painamalla esimerkiksi tietokohteen esittely- tai listaussivulla. (0,5p)
3. [ ] Lisää malliisi tarvittavat validaattorit ja estä kontrollereissa virheellisten syötteiden lisääminen tietokantaan. Muista näyttää lomakkeissa virhetilanteissa virheilmoitukset ja täyttää kentät käyttäjän antamilla syötteillä. (0,5p)
4. [x] Toteuta malliluokka sovelluksen käyttäjälle ja toteuta käyttäjän kirjautuminen. Toteuta get_user_logged_in-metodi ja käytä tarvittaessa kirjautuneen käyttäjän tietoa hyväksi näkymissä ja malleissa. (0,5p)
5. [x] Kirjoita alustava käynnistys- / käyttöohje dokumentaatioosi. ~~Lisää myös reposi README.md tiedostoon käyttäjätunnus ja salasana, jolla ohjaaja voi kirjautua sisään sovellukseesi.~~ (0.5p)

## Viikko 5
1. [x] Toteuta käyttäjän uloskirjautuminen ja estä kirjautumattoman käyttäjän pääsy sivuille, jotka vaativat kirjautumisen. (1p)
2. [x] Edistä sovellustasi ja pidä koodi siistinä noudattamalla selkeää kansiorakennetta ja järkevää nimeämistä tiedostojen, luokkien ja metodien nimissä. Vaatimuksena on, että ainakin kahdelle tietokohteelle on toteutettu sivuja. Kaikkia CRUD-nelikon osia ei kuitenkaan tarvitse toteuttaa, listaus- ja esittelysivut uudelle tietokohteelle riittävät hyvin. Lisäksi kaikkien toimintojen tulee toimia ja virhetilanteissa käyttäjälle täytyy antaa järkeviä virheilmoituksia. (1p)
3. [ ] Lisää dokumentaatioosi järjestelmän-yleisrakenne-osio ja käyttöliittymän ja järjestelmän komponentteja kuvaa kaavio. (1p)
4. [ ] Kirjoita koodikatselmointi (vapaaehtoinen). (0-2p)
