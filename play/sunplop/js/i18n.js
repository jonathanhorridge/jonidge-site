/* All UI text lives here. Puzzles themselves are language-free (suns + numbers).
 * English is the source language. de/fr/es/pt are first-pass translations (review before launch).
 * To add a language: copy the `en` block, translate the values, add the code to LANGS. */
(function (root) {
  'use strict';
  var LANGS = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português' };
  var S = {};
  S.en = {
    tagline: 'A fresh sun puzzle every day',
    tab_today: 'Today', tab_archive: 'Archive', tab_practice: 'Practice', tab_shop: 'Shop',
    main_title: 'Daily Sun', main_sub: 'Counts for your streak · shareable',
    bonus_title: 'Bonus', diff_easy: 'Easy', diff_medium: 'Medium', diff_hard: 'Hard',
    play: 'Play', resume: 'Resume', solved: 'Solved', locked: 'Locked',
    help_title: 'How to play',
    help_1: 'Put exactly 2 suns in every row and every column.',
    help_2: 'A number is never a sun. It counts the suns touching it, diagonals included.',
    help_3: 'Tap once for a sun, twice for a dot (no sun), a third time to clear.',
    help_go: "Let's play",
    undo: 'Undo', clear: 'Clear', hint: 'Hint',
    solved_title: 'Sunny!', time: 'Time', hints_used: 'Hints',
    reward_base: 'Puzzle reward', reward_speed: 'Speed bonus', reward_archive: 'Archive puzzle (half reward)',
    reward_streak: 'Streak milestone: {n} days', reward_total: 'Total',
    share: 'Share result', copied: 'Copied! Paste it anywhere.', next: 'Next puzzle', home: 'Home',
    streak: 'Streak', best: 'Best', days: 'days',
    archive_title: 'Past days', archive_note: 'The last {n} days are free. Unlock older days with Rays.',
    archive_unlock: 'Unlock', unlocked: 'Unlocked!', not_enough: 'Not enough Rays',
    practice_title: 'Practice', practice_note: 'Unlimited puzzles. No rewards, no pressure.', practice_new: 'New puzzle',
    shop_title: 'Shop', shop_mock: 'Test mode: purchases are simulated. No real money is charged.',
    shop_free: 'Free Rays', shop_ad: 'Watch an ad', shop_ad_left: '{n} left today',
    shop_packs: 'Ray packs', shop_items: 'Items', bonus_pct: '+{n}% bonus',
    pack_1: 'Handful', pack_2: 'Pouch', pack_3: 'Chest', pack_4: 'Treasure',
    popular: 'Popular', best_value: 'Best value', starter: 'Starter offer',
    starter_desc: 'One time only: {coins} Rays + 2 Jokers', joker_name: 'Streak Joker',
    joker_desc: 'Restores a broken streak.', noads_name: 'No banner ads', noads_desc: 'Removes banner ads forever.',
    owned: 'Owned: {n}', buy: 'Buy', bought: 'Purchase complete (simulated)',
    confirm_title: 'Simulated purchase', confirm_body: '{item} for {price}. No money will be charged.',
    confirm: 'Confirm', cancel: 'Cancel', region: 'Prices for: {r}',
    ad_title: 'Ad placeholder', ad_body: 'A rewarded video ad would play here.', ad_wait: 'Reward in {n}s', ad_claim: 'Claim reward',
    joker_title: 'Your streak broke!', joker_body: 'You had a {n}-day streak. Bring it back?',
    joker_use: 'Use a Joker (owned: {n})', joker_buy: 'Restore for {n}', joker_decline: 'Start over',
    joker_window: 'Offer ends at midnight.', streak_restored: 'Streak restored!',
    hint_title: 'Need a hint?', hint_body: 'Reveal one correct cell.', hint_pay: 'Use {n}', hint_ad: 'Watch an ad',
    settings: 'Settings', language: 'Language', sound: 'Sound', music: 'Music', volume: 'Volume', on: 'On', off: 'Off',
    welcome_gift: 'Welcome gift: {n} Rays!', currency: 'Rays'
  };
  S.de = {
    tagline: 'Jeden Tag ein neues Sonnenrätsel',
    tab_today: 'Heute', tab_archive: 'Archiv', tab_practice: 'Training', tab_shop: 'Shop',
    main_title: 'Tagessonne', main_sub: 'Zählt für deine Serie · teilbar',
    bonus_title: 'Bonus', diff_easy: 'Leicht', diff_medium: 'Mittel', diff_hard: 'Schwer',
    play: 'Spielen', resume: 'Weiter', solved: 'Gelöst', locked: 'Gesperrt',
    help_title: 'So wird gespielt',
    help_1: 'Setze genau 2 Sonnen in jede Zeile und jede Spalte.',
    help_2: 'Eine Zahl ist nie eine Sonne. Sie zählt die angrenzenden Sonnen, auch diagonal.',
    help_3: 'Einmal tippen für eine Sonne, zweimal für einen Punkt (keine Sonne), dreimal zum Löschen.',
    help_go: 'Los geht’s',
    undo: 'Zurück', clear: 'Leeren', hint: 'Tipp',
    solved_title: 'Sonnig!', time: 'Zeit', hints_used: 'Tipps',
    reward_base: 'Belohnung', reward_speed: 'Tempobonus', reward_archive: 'Archivrätsel (halbe Belohnung)',
    reward_streak: 'Serien-Meilenstein: {n} Tage', reward_total: 'Gesamt',
    share: 'Ergebnis teilen', copied: 'Kopiert! Überall einfügen.', next: 'Nächstes Rätsel', home: 'Start',
    streak: 'Serie', best: 'Rekord', days: 'Tage',
    archive_title: 'Vergangene Tage', archive_note: 'Die letzten {n} Tage sind gratis. Ältere mit Strahlen freischalten.',
    archive_unlock: 'Freischalten', unlocked: 'Freigeschaltet!', not_enough: 'Nicht genug Strahlen',
    practice_title: 'Training', practice_note: 'Unbegrenzt Rätsel. Ohne Belohnung, ohne Druck.', practice_new: 'Neues Rätsel',
    shop_title: 'Shop', shop_mock: 'Testmodus: Käufe werden simuliert. Es wird kein Geld abgebucht.',
    shop_free: 'Gratis-Strahlen', shop_ad: 'Werbung ansehen', shop_ad_left: 'Heute noch {n}',
    shop_packs: 'Strahlen-Pakete', shop_items: 'Extras', bonus_pct: '+{n}% Bonus',
    pack_1: 'Handvoll', pack_2: 'Beutel', pack_3: 'Truhe', pack_4: 'Schatz',
    popular: 'Beliebt', best_value: 'Bester Wert', starter: 'Startangebot',
    starter_desc: 'Einmalig: {coins} Strahlen + 2 Joker', joker_name: 'Serien-Joker',
    joker_desc: 'Stellt eine verlorene Serie wieder her.', noads_name: 'Keine Banner', noads_desc: 'Entfernt Bannerwerbung für immer.',
    owned: 'Besitz: {n}', buy: 'Kaufen', bought: 'Kauf abgeschlossen (simuliert)',
    confirm_title: 'Simulierter Kauf', confirm_body: '{item} für {price}. Es wird kein Geld abgebucht.',
    confirm: 'Bestätigen', cancel: 'Abbrechen', region: 'Preise für: {r}',
    ad_title: 'Werbe-Platzhalter', ad_body: 'Hier würde ein Belohnungsvideo laufen.', ad_wait: 'Belohnung in {n}s', ad_claim: 'Belohnung holen',
    joker_title: 'Deine Serie ist gerissen!', joker_body: 'Du hattest eine Serie von {n} Tagen. Zurückholen?',
    joker_use: 'Joker einsetzen (Besitz: {n})', joker_buy: 'Für {n} retten', joker_decline: 'Neu anfangen',
    joker_window: 'Angebot gilt bis Mitternacht.', streak_restored: 'Serie gerettet!',
    hint_title: 'Brauchst du einen Tipp?', hint_body: 'Deckt ein richtiges Feld auf.', hint_pay: '{n} einsetzen', hint_ad: 'Werbung ansehen',
    settings: 'Einstellungen', language: 'Sprache', sound: 'Ton', music: 'Musik', volume: 'Lautstärke', on: 'An', off: 'Aus',
    welcome_gift: 'Willkommensgeschenk: {n} Strahlen!', currency: 'Strahlen'
  };
  S.fr = {
    tagline: 'Un nouveau puzzle soleil chaque jour',
    tab_today: 'Aujourd’hui', tab_archive: 'Archives', tab_practice: 'Entraînement', tab_shop: 'Boutique',
    main_title: 'Soleil du jour', main_sub: 'Compte pour ta série · à partager',
    bonus_title: 'Bonus', diff_easy: 'Facile', diff_medium: 'Moyen', diff_hard: 'Difficile',
    play: 'Jouer', resume: 'Reprendre', solved: 'Résolu', locked: 'Verrouillé',
    help_title: 'Comment jouer',
    help_1: 'Place exactement 2 soleils dans chaque ligne et chaque colonne.',
    help_2: 'Un chiffre n’est jamais un soleil. Il compte les soleils qui le touchent, diagonales comprises.',
    help_3: 'Touche une fois pour un soleil, deux fois pour un point (pas de soleil), trois fois pour effacer.',
    help_go: 'C’est parti',
    undo: 'Annuler', clear: 'Effacer', hint: 'Indice',
    solved_title: 'Ensoleillé !', time: 'Temps', hints_used: 'Indices',
    reward_base: 'Récompense', reward_speed: 'Bonus vitesse', reward_archive: 'Puzzle d’archive (demi-récompense)',
    reward_streak: 'Palier de série : {n} jours', reward_total: 'Total',
    share: 'Partager', copied: 'Copié ! Colle-le où tu veux.', next: 'Puzzle suivant', home: 'Accueil',
    streak: 'Série', best: 'Record', days: 'jours',
    archive_title: 'Jours passés', archive_note: 'Les {n} derniers jours sont gratuits. Débloque les plus anciens avec des Rayons.',
    archive_unlock: 'Débloquer', unlocked: 'Débloqué !', not_enough: 'Pas assez de Rayons',
    practice_title: 'Entraînement', practice_note: 'Puzzles illimités. Sans récompense, sans pression.', practice_new: 'Nouveau puzzle',
    shop_title: 'Boutique', shop_mock: 'Mode test : les achats sont simulés. Aucun argent n’est débité.',
    shop_free: 'Rayons gratuits', shop_ad: 'Regarder une pub', shop_ad_left: 'Encore {n} aujourd’hui',
    shop_packs: 'Packs de Rayons', shop_items: 'Objets', bonus_pct: '+{n}% bonus',
    pack_1: 'Poignée', pack_2: 'Bourse', pack_3: 'Coffre', pack_4: 'Trésor',
    popular: 'Populaire', best_value: 'Meilleure offre', starter: 'Offre de départ',
    starter_desc: 'Une seule fois : {coins} Rayons + 2 Jokers', joker_name: 'Joker de série',
    joker_desc: 'Restaure une série perdue.', noads_name: 'Sans bannières', noads_desc: 'Supprime les bannières pour toujours.',
    owned: 'Possédés : {n}', buy: 'Acheter', bought: 'Achat terminé (simulé)',
    confirm_title: 'Achat simulé', confirm_body: '{item} pour {price}. Aucun argent ne sera débité.',
    confirm: 'Confirmer', cancel: 'Annuler', region: 'Prix pour : {r}',
    ad_title: 'Emplacement pub', ad_body: 'Une vidéo récompensée serait diffusée ici.', ad_wait: 'Récompense dans {n}s', ad_claim: 'Récupérer',
    joker_title: 'Ta série est rompue !', joker_body: 'Tu avais une série de {n} jours. La récupérer ?',
    joker_use: 'Utiliser un Joker ({n})', joker_buy: 'Restaurer pour {n}', joker_decline: 'Recommencer',
    joker_window: 'Offre valable jusqu’à minuit.', streak_restored: 'Série restaurée !',
    hint_title: 'Besoin d’un indice ?', hint_body: 'Révèle une case correcte.', hint_pay: 'Utiliser {n}', hint_ad: 'Regarder une pub',
    settings: 'Réglages', language: 'Langue', sound: 'Son', music: 'Musique', volume: 'Volume', on: 'Oui', off: 'Non',
    welcome_gift: 'Cadeau de bienvenue : {n} Rayons !', currency: 'Rayons'
  };
  S.es = {
    tagline: 'Un nuevo puzle de soles cada día',
    tab_today: 'Hoy', tab_archive: 'Archivo', tab_practice: 'Práctica', tab_shop: 'Tienda',
    main_title: 'Sol del día', main_sub: 'Cuenta para tu racha · para compartir',
    bonus_title: 'Extra', diff_easy: 'Fácil', diff_medium: 'Medio', diff_hard: 'Difícil',
    play: 'Jugar', resume: 'Seguir', solved: 'Resuelto', locked: 'Bloqueado',
    help_title: 'Cómo se juega',
    help_1: 'Pon exactamente 2 soles en cada fila y cada columna.',
    help_2: 'Un número nunca es un sol. Cuenta los soles que lo tocan, incluidas las diagonales.',
    help_3: 'Toca una vez para un sol, dos para un punto (sin sol), tres para borrar.',
    help_go: '¡A jugar!',
    undo: 'Deshacer', clear: 'Borrar', hint: 'Pista',
    solved_title: '¡Soleado!', time: 'Tiempo', hints_used: 'Pistas',
    reward_base: 'Recompensa', reward_speed: 'Bonus de velocidad', reward_archive: 'Puzle de archivo (media recompensa)',
    reward_streak: 'Hito de racha: {n} días', reward_total: 'Total',
    share: 'Compartir', copied: '¡Copiado! Pégalo donde quieras.', next: 'Siguiente puzle', home: 'Inicio',
    streak: 'Racha', best: 'Récord', days: 'días',
    archive_title: 'Días pasados', archive_note: 'Los últimos {n} días son gratis. Desbloquea los anteriores con Rayos.',
    archive_unlock: 'Desbloquear', unlocked: '¡Desbloqueado!', not_enough: 'No tienes suficientes Rayos',
    practice_title: 'Práctica', practice_note: 'Puzles ilimitados. Sin recompensas, sin presión.', practice_new: 'Nuevo puzle',
    shop_title: 'Tienda', shop_mock: 'Modo prueba: las compras son simuladas. No se cobra dinero real.',
    shop_free: 'Rayos gratis', shop_ad: 'Ver un anuncio', shop_ad_left: 'Quedan {n} hoy',
    shop_packs: 'Packs de Rayos', shop_items: 'Objetos', bonus_pct: '+{n}% extra',
    pack_1: 'Puñado', pack_2: 'Bolsa', pack_3: 'Cofre', pack_4: 'Tesoro',
    popular: 'Popular', best_value: 'Mejor valor', starter: 'Oferta inicial',
    starter_desc: 'Solo una vez: {coins} Rayos + 2 Comodines', joker_name: 'Comodín de racha',
    joker_desc: 'Recupera una racha perdida.', noads_name: 'Sin banners', noads_desc: 'Quita los banners para siempre.',
    owned: 'Tienes: {n}', buy: 'Comprar', bought: 'Compra completada (simulada)',
    confirm_title: 'Compra simulada', confirm_body: '{item} por {price}. No se cobrará dinero.',
    confirm: 'Confirmar', cancel: 'Cancelar', region: 'Precios para: {r}',
    ad_title: 'Espacio publicitario', ad_body: 'Aquí se vería un vídeo con recompensa.', ad_wait: 'Recompensa en {n}s', ad_claim: 'Reclamar',
    joker_title: '¡Se rompió tu racha!', joker_body: 'Tenías una racha de {n} días. ¿Recuperarla?',
    joker_use: 'Usar un Comodín ({n})', joker_buy: 'Recuperar por {n}', joker_decline: 'Empezar de nuevo',
    joker_window: 'La oferta termina a medianoche.', streak_restored: '¡Racha recuperada!',
    hint_title: '¿Necesitas una pista?', hint_body: 'Revela una casilla correcta.', hint_pay: 'Usar {n}', hint_ad: 'Ver un anuncio',
    settings: 'Ajustes', language: 'Idioma', sound: 'Sonido', music: 'Música', volume: 'Volumen', on: 'Sí', off: 'No',
    welcome_gift: '¡Regalo de bienvenida: {n} Rayos!', currency: 'Rayos'
  };
  S.pt = {
    tagline: 'Um novo quebra-cabeça de sóis todo dia',
    tab_today: 'Hoje', tab_archive: 'Arquivo', tab_practice: 'Treino', tab_shop: 'Loja',
    main_title: 'Sol do dia', main_sub: 'Conta para a sua sequência · compartilhável',
    bonus_title: 'Bônus', diff_easy: 'Fácil', diff_medium: 'Médio', diff_hard: 'Difícil',
    play: 'Jogar', resume: 'Continuar', solved: 'Resolvido', locked: 'Bloqueado',
    help_title: 'Como jogar',
    help_1: 'Coloque exatamente 2 sóis em cada linha e cada coluna.',
    help_2: 'Um número nunca é um sol. Ele conta os sóis que o tocam, incluindo diagonais.',
    help_3: 'Toque uma vez para um sol, duas para um ponto (sem sol), três para limpar.',
    help_go: 'Vamos jogar',
    undo: 'Desfazer', clear: 'Limpar', hint: 'Dica',
    solved_title: 'Ensolarado!', time: 'Tempo', hints_used: 'Dicas',
    reward_base: 'Recompensa', reward_speed: 'Bônus de rapidez', reward_archive: 'Quebra-cabeça do arquivo (metade)',
    reward_streak: 'Marco de sequência: {n} dias', reward_total: 'Total',
    share: 'Compartilhar', copied: 'Copiado! Cole onde quiser.', next: 'Próximo', home: 'Início',
    streak: 'Sequência', best: 'Recorde', days: 'dias',
    archive_title: 'Dias anteriores', archive_note: 'Os últimos {n} dias são grátis. Desbloqueie os mais antigos com Raios.',
    archive_unlock: 'Desbloquear', unlocked: 'Desbloqueado!', not_enough: 'Raios insuficientes',
    practice_title: 'Treino', practice_note: 'Quebra-cabeças ilimitados. Sem recompensas, sem pressão.', practice_new: 'Novo',
    shop_title: 'Loja', shop_mock: 'Modo teste: compras simuladas. Nenhum dinheiro é cobrado.',
    shop_free: 'Raios grátis', shop_ad: 'Ver um anúncio', shop_ad_left: 'Restam {n} hoje',
    shop_packs: 'Pacotes de Raios', shop_items: 'Itens', bonus_pct: '+{n}% bônus',
    pack_1: 'Punhado', pack_2: 'Bolsa', pack_3: 'Baú', pack_4: 'Tesouro',
    popular: 'Popular', best_value: 'Melhor valor', starter: 'Oferta inicial',
    starter_desc: 'Só uma vez: {coins} Raios + 2 Coringas', joker_name: 'Coringa de sequência',
    joker_desc: 'Recupera uma sequência perdida.', noads_name: 'Sem banners', noads_desc: 'Remove os banners para sempre.',
    owned: 'Você tem: {n}', buy: 'Comprar', bought: 'Compra concluída (simulada)',
    confirm_title: 'Compra simulada', confirm_body: '{item} por {price}. Nenhum dinheiro será cobrado.',
    confirm: 'Confirmar', cancel: 'Cancelar', region: 'Preços para: {r}',
    ad_title: 'Espaço de anúncio', ad_body: 'Um vídeo premiado apareceria aqui.', ad_wait: 'Recompensa em {n}s', ad_claim: 'Pegar recompensa',
    joker_title: 'Sua sequência quebrou!', joker_body: 'Você tinha {n} dias seguidos. Recuperar?',
    joker_use: 'Usar um Coringa ({n})', joker_buy: 'Recuperar por {n}', joker_decline: 'Recomeçar',
    joker_window: 'Oferta válida até meia-noite.', streak_restored: 'Sequência recuperada!',
    hint_title: 'Precisa de uma dica?', hint_body: 'Revela uma casa correta.', hint_pay: 'Usar {n}', hint_ad: 'Ver um anúncio',
    settings: 'Ajustes', language: 'Idioma', sound: 'Som', music: 'Música', volume: 'Volume', on: 'Sim', off: 'Não',
    welcome_gift: 'Presente de boas-vindas: {n} Raios!', currency: 'Raios'
  };


  // ---- v2: levels mode ----
  Object.assign(S.en, {
    tab_levels: 'Levels', levels_title: 'Levels', chapter: 'Chapter {n}', level: 'Level {n}',
    continue_level: 'Continue', next_level: 'Next level', replay: 'Replay', map: 'Map', skip: 'Skip',
    skip_title: 'Skip this level?', skip_body: 'Unlock the next level now. You can come back for stars later.',
    level_complete: 'Level complete!', reward_stars: 'Stars ×{n}', reward_new_stars: 'New stars ×{n}', reward_chapter: 'Chapter {n} cleared!',
    par_hint: '★★★ = no hints, under {t}', total_stars: '{n} stars', more_chapters: '…and {n} more chapters (up to level {m})',
    intro_new: 'New!', intro_ok: 'Got it',
    intro_size_title: 'Bigger grid: {n}×{n}', intro_size_body: 'Same rule: still exactly 2 suns in every row and every column.',
    intro_cloud_title: 'Clouds', intro_cloud_body: 'A cloud is never a sun and counts nothing. It just takes up space.',
    intro_plus_title: 'Green numbers', intro_plus_body: 'A green number counts only the 4 tiles directly beside it. Diagonals don’t count.',
    ad_interstitial: 'Ad break', ad_close_in: 'Close in {n}s', ad_close: 'Close ✕', main_sub: 'Same puzzle for everyone · keeps your streak'
  });
  Object.assign(S.de, {
    tab_levels: 'Level', levels_title: 'Level', chapter: 'Kapitel {n}', level: 'Level {n}',
    continue_level: 'Weiter', next_level: 'Nächstes Level', replay: 'Nochmal', map: 'Karte', skip: 'Überspringen',
    skip_title: 'Level überspringen?', skip_body: 'Schaltet das nächste Level sofort frei. Sterne kannst du später holen.',
    level_complete: 'Level geschafft!', reward_stars: 'Sterne ×{n}', reward_new_stars: 'Neue Sterne ×{n}', reward_chapter: 'Kapitel {n} geschafft!',
    par_hint: '★★★ = ohne Tipps, unter {t}', total_stars: '{n} Sterne', more_chapters: '…und {n} weitere Kapitel (bis Level {m})',
    intro_new: 'Neu!', intro_ok: 'Verstanden',
    intro_size_title: 'Größeres Feld: {n}×{n}', intro_size_body: 'Gleiche Regel: genau 2 Sonnen in jeder Zeile und Spalte.',
    intro_cloud_title: 'Wolken', intro_cloud_body: 'Eine Wolke ist nie eine Sonne und zählt nichts. Sie belegt nur Platz.',
    intro_plus_title: 'Grüne Zahlen', intro_plus_body: 'Eine grüne Zahl zählt nur die 4 direkt angrenzenden Felder. Diagonalen zählen nicht.',
    ad_interstitial: 'Werbepause', ad_close_in: 'Schließen in {n}s', ad_close: 'Schließen ✕', main_sub: 'Gleiches Rätsel für alle · hält deine Serie'
  });
  Object.assign(S.fr, {
    tab_levels: 'Niveaux', levels_title: 'Niveaux', chapter: 'Chapitre {n}', level: 'Niveau {n}',
    continue_level: 'Continuer', next_level: 'Niveau suivant', replay: 'Rejouer', map: 'Carte', skip: 'Passer',
    skip_title: 'Passer ce niveau ?', skip_body: 'Débloque le niveau suivant tout de suite. Tu pourras revenir pour les étoiles.',
    level_complete: 'Niveau réussi !', reward_stars: 'Étoiles ×{n}', reward_new_stars: 'Nouvelles étoiles ×{n}', reward_chapter: 'Chapitre {n} terminé !',
    par_hint: '★★★ = sans indice, en moins de {t}', total_stars: '{n} étoiles', more_chapters: '…et {n} chapitres de plus (jusqu’au niveau {m})',
    intro_new: 'Nouveau !', intro_ok: 'Compris',
    intro_size_title: 'Grille plus grande : {n}×{n}', intro_size_body: 'Même règle : exactement 2 soleils par ligne et par colonne.',
    intro_cloud_title: 'Nuages', intro_cloud_body: 'Un nuage n’est jamais un soleil et ne compte rien. Il prend juste de la place.',
    intro_plus_title: 'Chiffres verts', intro_plus_body: 'Un chiffre vert ne compte que les 4 cases juste à côté. Les diagonales ne comptent pas.',
    ad_interstitial: 'Pause pub', ad_close_in: 'Fermer dans {n}s', ad_close: 'Fermer ✕', main_sub: 'Le même pour tous · garde ta série'
  });
  Object.assign(S.es, {
    tab_levels: 'Niveles', levels_title: 'Niveles', chapter: 'Capítulo {n}', level: 'Nivel {n}',
    continue_level: 'Continuar', next_level: 'Siguiente nivel', replay: 'Repetir', map: 'Mapa', skip: 'Saltar',
    skip_title: '¿Saltar este nivel?', skip_body: 'Desbloquea el siguiente nivel ya. Puedes volver por las estrellas.',
    level_complete: '¡Nivel superado!', reward_stars: 'Estrellas ×{n}', reward_new_stars: 'Estrellas nuevas ×{n}', reward_chapter: '¡Capítulo {n} completado!',
    par_hint: '★★★ = sin pistas, en menos de {t}', total_stars: '{n} estrellas', more_chapters: '…y {n} capítulos más (hasta el nivel {m})',
    intro_new: '¡Nuevo!', intro_ok: 'Entendido',
    intro_size_title: 'Cuadrícula más grande: {n}×{n}', intro_size_body: 'Misma regla: exactamente 2 soles en cada fila y columna.',
    intro_cloud_title: 'Nubes', intro_cloud_body: 'Una nube nunca es un sol y no cuenta nada. Solo ocupa espacio.',
    intro_plus_title: 'Números verdes', intro_plus_body: 'Un número verde solo cuenta las 4 casillas de al lado. Las diagonales no cuentan.',
    ad_interstitial: 'Pausa publicitaria', ad_close_in: 'Cerrar en {n}s', ad_close: 'Cerrar ✕', main_sub: 'El mismo para todos · mantiene tu racha'
  });
  Object.assign(S.pt, {
    tab_levels: 'Níveis', levels_title: 'Níveis', chapter: 'Capítulo {n}', level: 'Nível {n}',
    continue_level: 'Continuar', next_level: 'Próximo nível', replay: 'Repetir', map: 'Mapa', skip: 'Pular',
    skip_title: 'Pular este nível?', skip_body: 'Libera o próximo nível agora. Você pode voltar pelas estrelas depois.',
    level_complete: 'Nível concluído!', reward_stars: 'Estrelas ×{n}', reward_new_stars: 'Novas estrelas ×{n}', reward_chapter: 'Capítulo {n} concluído!',
    par_hint: '★★★ = sem dicas, em menos de {t}', total_stars: '{n} estrelas', more_chapters: '…e mais {n} capítulos (até o nível {m})',
    intro_new: 'Novo!', intro_ok: 'Entendi',
    intro_size_title: 'Grade maior: {n}×{n}', intro_size_body: 'Mesma regra: exatamente 2 sóis em cada linha e coluna.',
    intro_cloud_title: 'Nuvens', intro_cloud_body: 'Uma nuvem nunca é um sol e não conta nada. Só ocupa espaço.',
    intro_plus_title: 'Números verdes', intro_plus_body: 'Um número verde conta só as 4 casas logo ao lado. Diagonais não contam.',
    ad_interstitial: 'Intervalo', ad_close_in: 'Fechar em {n}s', ad_close: 'Fechar ✕', main_sub: 'O mesmo para todos · mantém sua sequência'
  });
  // ---- v4: store build (legal/guides/build-requirements.md B1-B9) ----
  Object.assign(S.en, {
    noads_name: 'No ads', noads_desc: 'Removes banner and between-level ads. Optional reward videos stay available.',
    starter_desc: '{coins} Rays + 2 Streak Jokers · one-time offer',
    shop_footer: 'Rays are saved on this device. Uninstalling or clearing app data removes them. Rays have no cash value.',
    privacy: 'Privacy Policy', terms: 'Terms of Use', privacy_ads: 'Privacy & ads', manage_privacy: 'Manage privacy choices',
    dns: 'Do Not Sell or Share My Personal Information',
    restore: 'Restore purchases', restored_noads: 'No ads restored', restored_none: 'Nothing to restore', store_error: 'The store could not be reached. Please try again later.',
    withdraw: 'Withdraw from a purchase',
    withdraw_body: 'Rays, the Starter offer and No ads are delivered immediately. If you agreed to that, the 14-day right of withdrawal no longer applies. To withdraw from a purchase that was not delivered yet, or to ask for a refund: Apple: reportaproblem.apple.com · Google Play: the refund page in your Play account · or email us with your order ID.',
    delete_data: 'Delete game data', delete_body: 'This erases your progress, Rays, Jokers and settings on this device. It cannot be undone. Store purchases like No ads can be restored afterwards.',
    delete_confirm: 'Delete everything', deleted: 'Game data deleted',
    contact: 'Contact support', about: 'About & licences', version: 'Version {v}', close: 'Close',
    about_licences: 'Open-source licences: Capacitor (MIT), RevenueCat Purchases SDK (MIT), capacitor-community AdMob plugin (MIT). Google Mobile Ads SDK and User Messaging Platform: Google terms. Sounds and music made with ElevenLabs.',
    first_notice: 'By playing you agree to the {terms}. See how we handle data in the {privacy}.',
    waiver_title: 'Before you buy', waiver_text: 'I want the item delivered immediately and understand that I lose my 14-day right of withdrawal once it is delivered.',
    buy: 'Buy', unavailable: 'Not available', store_unavailable: 'The store is not available right now.',
    purchase_pending: 'Payment pending. Your item arrives as soon as the payment is complete.', purchase_failed: 'The purchase did not go through. You were not charged.',
    already_owned: 'You already own this. Tap Restore purchases in Settings.', ad_unavailable: 'No video available right now. Please try again later.',
    att_title: 'About ads', att_body: 'Sunplop is free thanks to ads. On the next screen iOS asks whether apps may use your device’s advertising identifier. You can say no: the game and its rewards stay exactly the same.', att_continue: 'Continue',
    approx: '≈ {v}', support_id: 'Support ID', refunded: 'A refunded purchase was removed.'
  });
  Object.assign(S.de, {
    noads_name: 'Keine Werbung', noads_desc: 'Entfernt Banner und Werbung zwischen den Levels. Freiwillige Belohnungsvideos bleiben verfügbar.',
    starter_desc: '{coins} Strahlen + 2 Serien-Joker · einmaliges Angebot',
    shop_footer: 'Strahlen werden auf diesem Gerät gespeichert. Deinstallieren oder Löschen der App-Daten entfernt sie. Strahlen haben keinen Geldwert.',
    privacy: 'Datenschutzerklärung', terms: 'Nutzungsbedingungen', privacy_ads: 'Datenschutz & Werbung', manage_privacy: 'Datenschutzeinstellungen verwalten',
    dns: 'Meine personenbezogenen Daten nicht verkaufen oder teilen',
    restore: 'Käufe wiederherstellen', restored_noads: '„Keine Werbung“ wiederhergestellt', restored_none: 'Nichts wiederherzustellen', store_error: 'Der Store ist nicht erreichbar. Bitte später erneut versuchen.',
    withdraw: 'Von einem Kauf zurücktreten',
    withdraw_body: 'Strahlen, das Startangebot und „Keine Werbung“ werden sofort geliefert. Wenn du dem zugestimmt hast, gilt das 14-tägige Widerrufsrecht nicht mehr. Für einen Widerruf eines noch nicht gelieferten Kaufs oder eine Erstattung: Apple: reportaproblem.apple.com · Google Play: Erstattungsseite in deinem Play-Konto · oder schreib uns mit deiner Bestellnummer.',
    delete_data: 'Spieldaten löschen', delete_body: 'Das löscht deinen Fortschritt, deine Strahlen, Joker und Einstellungen auf diesem Gerät. Das kann nicht rückgängig gemacht werden. Store-Käufe wie „Keine Werbung“ lassen sich danach wiederherstellen.',
    delete_confirm: 'Alles löschen', deleted: 'Spieldaten gelöscht',
    contact: 'Support kontaktieren', about: 'Info & Lizenzen', version: 'Version {v}', close: 'Schließen',
    about_licences: 'Open-Source-Lizenzen: Capacitor (MIT), RevenueCat Purchases SDK (MIT), capacitor-community AdMob-Plugin (MIT). Google Mobile Ads SDK und User Messaging Platform: Google-Bedingungen. Sounds und Musik mit ElevenLabs erstellt.',
    first_notice: 'Mit dem Spielen stimmst du den {terms} zu. Wie wir mit Daten umgehen, steht in der {privacy}.',
    waiver_title: 'Vor dem Kauf', waiver_text: 'Ich möchte, dass der Artikel sofort geliefert wird, und weiß, dass ich mein 14-tägiges Widerrufsrecht mit der Lieferung verliere.',
    buy: 'Kaufen', unavailable: 'Nicht verfügbar', store_unavailable: 'Der Store ist gerade nicht verfügbar.',
    purchase_pending: 'Zahlung ausstehend. Dein Artikel kommt, sobald die Zahlung abgeschlossen ist.', purchase_failed: 'Der Kauf hat nicht geklappt. Es wurde nichts abgebucht.',
    already_owned: 'Das besitzt du schon. Tippe in den Einstellungen auf „Käufe wiederherstellen“.', ad_unavailable: 'Gerade ist kein Video verfügbar. Bitte später erneut versuchen.',
    att_title: 'Zur Werbung', att_body: 'Sunplop ist dank Werbung kostenlos. Auf dem nächsten Bildschirm fragt iOS, ob Apps die Werbe-ID deines Geräts nutzen dürfen. Du kannst ablehnen: Spiel und Belohnungen bleiben genau gleich.', att_continue: 'Weiter',
    approx: '≈ {v}', support_id: 'Support-ID', refunded: 'Ein erstatteter Kauf wurde entfernt.'
  });
  Object.assign(S.fr, {
    noads_name: 'Sans pub', noads_desc: 'Supprime les bannières et les pubs entre les niveaux. Les vidéos à récompense facultatives restent disponibles.',
    starter_desc: '{coins} Rayons + 2 Jokers de série · offre unique',
    shop_footer: 'Les Rayons sont enregistrés sur cet appareil. Désinstaller l’app ou effacer ses données les supprime. Les Rayons n’ont aucune valeur monétaire.',
    privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation', privacy_ads: 'Confidentialité et pubs', manage_privacy: 'Gérer mes choix de confidentialité',
    dns: 'Ne pas vendre ni partager mes informations personnelles',
    restore: 'Restaurer les achats', restored_noads: '« Sans pub » restauré', restored_none: 'Rien à restaurer', store_error: 'La boutique est injoignable. Réessaie plus tard.',
    withdraw: 'Se rétracter d’un achat',
    withdraw_body: 'Les Rayons, l’offre de départ et « Sans pub » sont livrés immédiatement. Si tu l’as accepté, le droit de rétractation de 14 jours ne s’applique plus. Pour te rétracter d’un achat pas encore livré ou demander un remboursement : Apple : reportaproblem.apple.com · Google Play : page de remboursement de ton compte Play · ou écris-nous avec ton numéro de commande.',
    delete_data: 'Effacer les données du jeu', delete_body: 'Cela efface ta progression, tes Rayons, Jokers et réglages sur cet appareil. C’est irréversible. Les achats comme « Sans pub » peuvent être restaurés ensuite.',
    delete_confirm: 'Tout effacer', deleted: 'Données du jeu effacées',
    contact: 'Contacter le support', about: 'À propos et licences', version: 'Version {v}', close: 'Fermer',
    about_licences: 'Licences open source : Capacitor (MIT), RevenueCat Purchases SDK (MIT), plugin AdMob capacitor-community (MIT). Google Mobile Ads SDK et User Messaging Platform : conditions Google. Sons et musique créés avec ElevenLabs.',
    first_notice: 'En jouant, tu acceptes les {terms}. Découvre comment nous traitons les données dans la {privacy}.',
    waiver_title: 'Avant d’acheter', waiver_text: 'Je veux que l’article soit livré immédiatement et je comprends que je perds mon droit de rétractation de 14 jours une fois livré.',
    buy: 'Acheter', unavailable: 'Indisponible', store_unavailable: 'La boutique n’est pas disponible pour le moment.',
    purchase_pending: 'Paiement en attente. Ton article arrive dès que le paiement est terminé.', purchase_failed: 'L’achat n’a pas abouti. Rien n’a été débité.',
    already_owned: 'Tu possèdes déjà cet article. Touche « Restaurer les achats » dans les réglages.', ad_unavailable: 'Aucune vidéo disponible pour le moment. Réessaie plus tard.',
    att_title: 'À propos des pubs', att_body: 'Sunplop est gratuit grâce aux pubs. Sur l’écran suivant, iOS demande si les apps peuvent utiliser l’identifiant publicitaire de ton appareil. Tu peux refuser : le jeu et les récompenses restent identiques.', att_continue: 'Continuer',
    approx: '≈ {v}', support_id: 'ID support', refunded: 'Un achat remboursé a été retiré.'
  });
  Object.assign(S.es, {
    noads_name: 'Sin anuncios', noads_desc: 'Quita los banners y los anuncios entre niveles. Los vídeos con recompensa opcionales siguen disponibles.',
    starter_desc: '{coins} Rayos + 2 Comodines de racha · oferta única',
    shop_footer: 'Los Rayos se guardan en este dispositivo. Desinstalar la app o borrar sus datos los elimina. Los Rayos no tienen valor monetario.',
    privacy: 'Política de privacidad', terms: 'Condiciones de uso', privacy_ads: 'Privacidad y anuncios', manage_privacy: 'Gestionar opciones de privacidad',
    dns: 'No vender ni compartir mi información personal',
    restore: 'Restaurar compras', restored_noads: '«Sin anuncios» restaurado', restored_none: 'No hay nada que restaurar', store_error: 'No se pudo conectar con la tienda. Inténtalo más tarde.',
    withdraw: 'Desistir de una compra',
    withdraw_body: 'Los Rayos, la oferta inicial y «Sin anuncios» se entregan al instante. Si lo aceptaste, el derecho de desistimiento de 14 días ya no se aplica. Para desistir de una compra aún no entregada o pedir un reembolso: Apple: reportaproblem.apple.com · Google Play: página de reembolsos de tu cuenta de Play · o escríbenos con tu número de pedido.',
    delete_data: 'Borrar datos del juego', delete_body: 'Esto borra tu progreso, Rayos, Comodines y ajustes en este dispositivo. No se puede deshacer. Las compras como «Sin anuncios» se pueden restaurar después.',
    delete_confirm: 'Borrar todo', deleted: 'Datos del juego borrados',
    contact: 'Contactar con soporte', about: 'Acerca de y licencias', version: 'Versión {v}', close: 'Cerrar',
    about_licences: 'Licencias de código abierto: Capacitor (MIT), RevenueCat Purchases SDK (MIT), plugin AdMob de capacitor-community (MIT). Google Mobile Ads SDK y User Messaging Platform: condiciones de Google. Sonidos y música creados con ElevenLabs.',
    first_notice: 'Al jugar aceptas las {terms}. Consulta cómo tratamos los datos en la {privacy}.',
    waiver_title: 'Antes de comprar', waiver_text: 'Quiero que el artículo se entregue de inmediato y entiendo que pierdo mi derecho de desistimiento de 14 días una vez entregado.',
    buy: 'Comprar', unavailable: 'No disponible', store_unavailable: 'La tienda no está disponible ahora mismo.',
    purchase_pending: 'Pago pendiente. Tu artículo llegará en cuanto se complete el pago.', purchase_failed: 'La compra no se completó. No se te ha cobrado nada.',
    already_owned: 'Ya tienes esto. Toca «Restaurar compras» en Ajustes.', ad_unavailable: 'No hay vídeos disponibles ahora mismo. Inténtalo más tarde.',
    att_title: 'Sobre los anuncios', att_body: 'Sunplop es gratis gracias a los anuncios. En la siguiente pantalla, iOS pregunta si las apps pueden usar el identificador publicitario de tu dispositivo. Puedes decir que no: el juego y las recompensas siguen igual.', att_continue: 'Continuar',
    approx: '≈ {v}', support_id: 'ID de soporte', refunded: 'Se retiró una compra reembolsada.'
  });
  Object.assign(S.pt, {
    noads_name: 'Sem anúncios', noads_desc: 'Remove os banners e os anúncios entre níveis. Os vídeos com recompensa opcionais continuam disponíveis.',
    starter_desc: '{coins} Raios + 2 Coringas de sequência · oferta única',
    shop_footer: 'Os Raios ficam salvos neste aparelho. Desinstalar o app ou apagar os dados dele os remove. Raios não têm valor em dinheiro.',
    privacy: 'Política de Privacidade', terms: 'Termos de Uso', privacy_ads: 'Privacidade e anúncios', manage_privacy: 'Gerenciar opções de privacidade',
    dns: 'Não vender nem compartilhar minhas informações pessoais',
    restore: 'Restaurar compras', restored_noads: '“Sem anúncios” restaurado', restored_none: 'Nada para restaurar', store_error: 'Não foi possível acessar a loja. Tente mais tarde.',
    withdraw: 'Desistir de uma compra',
    withdraw_body: 'Raios, a oferta inicial e “Sem anúncios” são entregues na hora. Se você concordou com isso, o direito de arrependimento de 14 dias não se aplica mais. Para desistir de uma compra ainda não entregue ou pedir reembolso: Apple: reportaproblem.apple.com · Google Play: página de reembolso da sua conta Play · ou escreva para nós com o número do pedido.',
    delete_data: 'Apagar dados do jogo', delete_body: 'Isso apaga seu progresso, Raios, Coringas e configurações neste aparelho. Não dá para desfazer. Compras como “Sem anúncios” podem ser restauradas depois.',
    delete_confirm: 'Apagar tudo', deleted: 'Dados do jogo apagados',
    contact: 'Falar com o suporte', about: 'Sobre e licenças', version: 'Versão {v}', close: 'Fechar',
    about_licences: 'Licenças de código aberto: Capacitor (MIT), RevenueCat Purchases SDK (MIT), plugin AdMob do capacitor-community (MIT). Google Mobile Ads SDK e User Messaging Platform: termos do Google. Sons e música criados com ElevenLabs.',
    first_notice: 'Ao jogar, você aceita os {terms}. Veja como tratamos os dados na {privacy}.',
    waiver_title: 'Antes de comprar', waiver_text: 'Quero que o item seja entregue imediatamente e entendo que perco meu direito de arrependimento de 14 dias quando ele for entregue.',
    buy: 'Comprar', unavailable: 'Indisponível', store_unavailable: 'A loja não está disponível agora.',
    purchase_pending: 'Pagamento pendente. Seu item chega assim que o pagamento for concluído.', purchase_failed: 'A compra não foi concluída. Nada foi cobrado.',
    already_owned: 'Você já tem isso. Toque em “Restaurar compras” nas configurações.', ad_unavailable: 'Nenhum vídeo disponível agora. Tente mais tarde.',
    att_title: 'Sobre os anúncios', att_body: 'O Sunplop é grátis graças aos anúncios. Na próxima tela, o iOS pergunta se os apps podem usar o identificador de publicidade do seu aparelho. Você pode recusar: o jogo e as recompensas continuam iguais.', att_continue: 'Continuar',
    approx: '≈ {v}', support_id: 'ID de suporte', refunded: 'Uma compra reembolsada foi removida.'
  });
  // Daily reminder (optional local notification). Neutral wording; the streak line is never used for children/minors.
  Object.assign(S.en, {
    reminder: 'Daily reminder', reminder_time: 'Time',
    reminder_note: 'One notification a day when the new puzzle is ready, skipped if you already played. Stored only on this device.',
    reminder_title: 'Today’s Sunplop is ready ☀️', reminder_body: 'A fresh puzzle is waiting for you.', reminder_streak: 'Don’t lose your {n}-day streak!',
    reminder_channel: 'Daily reminder', reminder_channel_desc: 'One reminder a day when the new puzzle is ready.',
    reminder_ask_title: 'Want a daily reminder?',
    reminder_ask_body: 'We can send you one notification a day at {time} when the new puzzle is ready. Nothing else. You can change the time or turn it off in Settings any time.',
    reminder_yes: 'Remind me', reminder_no: 'Not now', reminder_set: 'Reminder set for {time}',
    reminder_blocked: 'Notifications are turned off for Sunplop. You can allow them in your phone’s settings.'
  });
  Object.assign(S.de, {
    reminder: 'Tägliche Erinnerung', reminder_time: 'Uhrzeit',
    reminder_note: 'Eine Mitteilung pro Tag, wenn das neue Rätsel bereit ist – entfällt, wenn du schon gespielt hast. Nur auf diesem Gerät gespeichert.',
    reminder_title: 'Das heutige Sunplop ist da ☀️', reminder_body: 'Ein neues Rätsel wartet auf dich.', reminder_streak: 'Verliere nicht deine Serie von {n} Tagen!',
    reminder_channel: 'Tägliche Erinnerung', reminder_channel_desc: 'Eine Erinnerung pro Tag, wenn das neue Rätsel bereit ist.',
    reminder_ask_title: 'Tägliche Erinnerung?',
    reminder_ask_body: 'Wir können dir täglich um {time} eine Mitteilung senden, wenn das neue Rätsel bereit ist. Sonst nichts. Uhrzeit ändern oder ausschalten kannst du jederzeit in den Einstellungen.',
    reminder_yes: 'Erinnere mich', reminder_no: 'Jetzt nicht', reminder_set: 'Erinnerung um {time} eingestellt',
    reminder_blocked: 'Mitteilungen sind für Sunplop ausgeschaltet. Du kannst sie in den Einstellungen deines Telefons erlauben.'
  });
  Object.assign(S.fr, {
    reminder: 'Rappel quotidien', reminder_time: 'Heure',
    reminder_note: 'Une notification par jour quand le nouveau puzzle est prêt, ignorée si tu as déjà joué. Enregistré uniquement sur cet appareil.',
    reminder_title: 'Le Sunplop du jour est prêt ☀️', reminder_body: 'Un nouveau puzzle t’attend.', reminder_streak: 'Ne perds pas ta série de {n} jours !',
    reminder_channel: 'Rappel quotidien', reminder_channel_desc: 'Un rappel par jour quand le nouveau puzzle est prêt.',
    reminder_ask_title: 'Un rappel quotidien ?',
    reminder_ask_body: 'Nous pouvons t’envoyer une notification par jour à {time} quand le nouveau puzzle est prêt. Rien d’autre. Tu peux changer l’heure ou le désactiver à tout moment dans les Réglages.',
    reminder_yes: 'Me le rappeler', reminder_no: 'Pas maintenant', reminder_set: 'Rappel réglé à {time}',
    reminder_blocked: 'Les notifications sont désactivées pour Sunplop. Tu peux les autoriser dans les réglages de ton téléphone.'
  });
  Object.assign(S.es, {
    reminder: 'Recordatorio diario', reminder_time: 'Hora',
    reminder_note: 'Una notificación al día cuando el nuevo puzle está listo; se omite si ya has jugado. Se guarda solo en este dispositivo.',
    reminder_title: 'El Sunplop de hoy está listo ☀️', reminder_body: 'Un puzle nuevo te está esperando.', reminder_streak: '¡No pierdas tu racha de {n} días!',
    reminder_channel: 'Recordatorio diario', reminder_channel_desc: 'Un recordatorio al día cuando el nuevo puzle está listo.',
    reminder_ask_title: '¿Quieres un recordatorio diario?',
    reminder_ask_body: 'Podemos enviarte una notificación al día a las {time} cuando el nuevo puzle esté listo. Nada más. Puedes cambiar la hora o desactivarlo cuando quieras en Ajustes.',
    reminder_yes: 'Recuérdamelo', reminder_no: 'Ahora no', reminder_set: 'Recordatorio a las {time}',
    reminder_blocked: 'Las notificaciones de Sunplop están desactivadas. Puedes permitirlas en los ajustes de tu teléfono.'
  });
  Object.assign(S.pt, {
    reminder: 'Lembrete diário', reminder_time: 'Horário',
    reminder_note: 'Uma notificação por dia quando o novo quebra-cabeça estiver pronto, pulada se você já jogou. Salvo só neste aparelho.',
    reminder_title: 'O Sunplop de hoje está pronto ☀️', reminder_body: 'Um novo quebra-cabeça está esperando por você.', reminder_streak: 'Não perca sua sequência de {n} dias!',
    reminder_channel: 'Lembrete diário', reminder_channel_desc: 'Um lembrete por dia quando o novo quebra-cabeça estiver pronto.',
    reminder_ask_title: 'Quer um lembrete diário?',
    reminder_ask_body: 'Podemos enviar uma notificação por dia às {time} quando o novo quebra-cabeça estiver pronto. Nada mais. Você pode mudar o horário ou desativar a qualquer momento nos Ajustes.',
    reminder_yes: 'Me lembre', reminder_no: 'Agora não', reminder_set: 'Lembrete definido para {time}',
    reminder_blocked: 'As notificações do Sunplop estão desativadas. Você pode permiti-las nos ajustes do seu celular.'
  });
  // remove keys from the old archive/practice/bonus design
  ['tab_archive', 'tab_practice', 'bonus_title', 'archive_title', 'archive_note', 'archive_unlock', 'unlocked', 'practice_title', 'practice_note',
   'practice_new', 'reward_archive', 'diff_easy', 'diff_medium', 'diff_hard'].forEach(function (k) { Object.keys(S).forEach(function (l) { delete S[l][k]; }); });

  var current = 'en';
  function detect() {
    var langs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || ['en'];
    for (var i = 0; i < langs.length; i++) {
      var code = String(langs[i] || '').slice(0, 2).toLowerCase();
      if (S[code]) return code;
    }
    return 'en';
  }
  function t(key, vars) {
    var s = (S[current] && S[current][key]) || S.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
    return s;
  }
  function setLang(code) { current = S[code] ? code : 'en'; if (typeof document !== 'undefined') document.documentElement.lang = current; }
  root.I18N = { t: t, setLang: setLang, detect: detect, LANGS: LANGS, STRINGS: S, get lang() { return current; } };
})(typeof self !== 'undefined' ? self : this);
