# Fonts

Lagret lokalt siden 2026-10-08, slik at det å laste en side ikke lenger sender besøkendes
IP-adresse til Google. Filene er latin- og latin-ext-delsettene Google Fonts serverer, kopiert én
gang og ikke endret. `css/fonts.css` deklarerer dem, og hver side lenker til den i stedet for
fonts.googleapis.com.

Readex Pro (variabel, 400–700) brukes på alle sider; Figtree (400–600) og Geologica 700 bare i `media/poengoversikt.html`. Alle er lisensiert under SIL Open Font License 1.1; lisensteksten ligger i `OFL-*.txt` her.

For å legge til en skrift eller vekt: hent Google Fonts-CSS-en for den med en moderne
nettleser-user-agent, last ned latin- og latin-ext-`.woff2`-filene den peker på, og legg til
tilsvarende `@font-face`-blokker i `css/fonts.css`. **Ikke lenk til fonts.googleapis.com igjen** —
personvernerklæringen sier at siden ikke gjør det.
