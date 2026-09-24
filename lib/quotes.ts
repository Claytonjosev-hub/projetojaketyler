export interface Quote {
  text: string;
  character: string;
  anime: string;
}

/**
 * Curated for a training app: effort, discipline and getting back up, not
 * catchphrases. Add more to the end — the rotation picks them up on its own.
 */
export const QUOTES: Quote[] = [
  {
    text: "Corra até não conseguir mais correr, e então volte a correr. O esforço constante é o maior atalho da vida.",
    character: "Genji Kamogawa",
    anime: "Hajime no Ippo",
  },
  {
    text: "O momento em que você recua é o momento em que você perde.",
    character: "Genji Kamogawa",
    anime: "Hajime no Ippo",
  },
  {
    text: "Quero me levantar e continuar tentando, não importa quantos socos eu leve.",
    character: "Ippo Makunouchi",
    anime: "Hajime no Ippo",
  },
  {
    text: "Odeio quem abusa dos fracos. Mas odeio mais ainda quem nunca revida.",
    character: "Mamoru Takamura",
    anime: "Hajime no Ippo",
  },
  {
    text: "Se você sentir que está atingindo seu limite, lembre-se por que você cerrou os punhos.",
    character: "All Might",
    anime: "My Hero Academia",
  },
  {
    text: "Ganhando ou perdendo, você sempre sai na frente aprendendo com a experiência.",
    character: "All Might",
    anime: "My Hero Academia",
  },
  {
    text: "Mesmo que eu não seja o mais forte, vou lutar com tudo que tenho.",
    character: "Izuku Midoriya",
    anime: "My Hero Academia",
  },
  {
    text: "100 flexões, 100 abdominais, 100 agachamentos e 10 km de corrida. Todo dia.",
    character: "Saitama",
    anime: "One Punch Man",
  },
  {
    text: "A força humana está na capacidade de mudar a si mesmo.",
    character: "Saitama",
    anime: "One Punch Man",
  },
  {
    text: "O esforço supera o talento quando o talento não se esforça.",
    character: "Rock Lee",
    anime: "Naruto",
  },
  {
    text: "A verdadeira qualidade de um shinobi não está na quantidade de talento, e sim na determinação de nunca desistir.",
    character: "Jiraiya",
    anime: "Naruto",
  },
  {
    text: "Uma pessoa só cresce quando é capaz de superar as próprias dificuldades.",
    character: "Jiraiya",
    anime: "Naruto",
  },
  {
    text: "Aqueles que não conseguem aceitar e superar as próprias falhas nunca se tornarão verdadeiros shinobis.",
    character: "Itachi Uchiha",
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
    text: "Não há vergonha em ser fraco. A vergonha está em continuar fraco.",
    character: "Fuegoleon Vermillion",
    anime: "Black Clover",
  },
  { text: "Supere seus limites. Agora mesmo.", character: "Yami Sukehiro", anime: "Black Clover" },
  { text: "Minha magia é nunca desistir.", character: "Asta", anime: "Black Clover" },
  {
    text: "Não há vergonha em cair. A vergonha é não se levantar de novo.",
    character: "Shintaro Midorima",
    anime: "Kuroko no Basket",
  },
  {
    text: "Você pode cair sete vezes, desde que se levante oito.",
    character: "Gintoki Sakata",
    anime: "Gintama",
  },
  {
    text: "No momento em que pensar em desistir, lembre do motivo pelo qual você aguentou até aqui.",
    character: "Natsu Dragneel",
    anime: "Fairy Tail",
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
  {
    text: "Se você não corre riscos, não pode criar um futuro.",
    character: "Monkey D. Luffy",
    anime: "One Piece",
  },
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
  {
    text: "Você pode morrer a qualquer momento, mas viver exige verdadeira coragem.",
    character: "Kenshin Himura",
    anime: "Rurouni Kenshin",
  },
  {
    text: "Errar faz parte. O que importa é aprender com isso.",
    character: "Killua Zoldyck",
    anime: "Hunter x Hunter",
  },
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
