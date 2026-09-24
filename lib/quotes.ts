export interface Quote {
  text: string;
  character: string;
  anime: string;
}

/**
 * Curated so every line is one a fan would actually recognise — short, and
 * credited to the character who says it. Add more to the end of the list; the
 * rotation picks up new entries on its own.
 */
export const QUOTES: Quote[] = [
  { text: "Supere seus limites. Agora mesmo.", character: "Yami Sukehiro", anime: "Black Clover" },
  { text: "Minha magia é nunca desistir.", character: "Asta", anime: "Black Clover" },
  { text: "Vá além. Plus Ultra!", character: "All Might", anime: "My Hero Academia" },
  {
    text: "100 flexões, 100 abdominais, 100 agachamentos e 10 km de corrida. Todo dia.",
    character: "Saitama",
    anime: "One Punch Man",
  },
  {
    text: "O esforço supera o talento quando o talento não se esforça.",
    character: "Rock Lee",
    anime: "Naruto",
  },
  {
    text: "Eu nunca volto atrás na minha palavra. Esse é o meu jeito ninja.",
    character: "Naruto Uzumaki",
    anime: "Naruto",
  },
  {
    text: "Quem quebra as regras é lixo, mas quem abandona os amigos é pior que lixo.",
    character: "Kakashi Hatake",
    anime: "Naruto",
  },
  {
    text: "Escolha a opção da qual você menos vai se arrepender.",
    character: "Levi Ackerman",
    anime: "Attack on Titan",
  },
  {
    text: "Se você não lutar, não pode vencer.",
    character: "Eren Yeager",
    anime: "Attack on Titan",
  },
  {
    text: "Para conseguir algo, é preciso dar algo de igual valor.",
    character: "Edward Elric",
    anime: "Fullmetal Alchemist",
  },
  {
    text: "O poder vem em resposta a uma necessidade, não a um desejo.",
    character: "Son Goku",
    anime: "Dragon Ball",
  },
  { text: "Incendeie seu coração.", character: "Kyojuro Rengoku", anime: "Demon Slayer" },
  { text: "Eu sou o mais forte.", character: "Satoru Gojo", anime: "Jujutsu Kaisen" },
  { text: "Eu vou ser o Rei dos Piratas.", character: "Monkey D. Luffy", anime: "One Piece" },
  {
    text: "Se eu não posso proteger nem o sonho do meu capitão, meu próprio sonho não vale nada.",
    character: "Roronoa Zoro",
    anime: "One Piece",
  },
  {
    text: "Acredite em você que acredita em mim.",
    character: "Kamina",
    anime: "Gurren Lagann",
  },
  { text: "Fure os céus com sua broca.", character: "Simon", anime: "Gurren Lagann" },
  { text: "Eu não tenho inimigos.", character: "Thorfinn", anime: "Vinland Saga" },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSinceEpoch(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** Same quote all day, a different one tomorrow. */
export function quoteForDate(date: string, quotes: Quote[] = QUOTES): Quote {
  return quotes[daysSinceEpoch(date) % quotes.length];
}
