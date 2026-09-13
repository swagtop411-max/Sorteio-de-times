export const REGRAS_SORTEIO = {
  homensPorTime: 2,
  mulheresPorTime: 2,
  totalPorTime: 4,
  alvo: 9,
  maximo: 10,
  equilibrioMinimo: 90
};

export function normalizarNivel(valor) {
  const v = String(valor).toLowerCase();
  if (v === "iniciante" || v === "1") return 1;
  if (v === "intermediário" || v === "intermediario" || v === "2") return 2;
  return 3;
}

export function nomeNivel(nivel) {
  return ["", "Iniciante", "Intermediário", "Avançado"][normalizarNivel(nivel)];
}

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pontuacao(time) {
  return time.reduce((s, j) => s + normalizarNivel(j.nivel), 0);
}

// Agrupa por gênero e nível para buscar o maior número de equipes sem
// enumerar combinações de nomes. Não existe limite de avançados.
// Somente equipes de 9 ou 10 pontos entram; isso também garante equilíbrio >= 90%.
function criarPadroes() {
  const padroes = [];
  for (let h1 = 1; h1 <= 3; h1++) for (let h2 = h1; h2 <= 3; h2++) {
    for (let m1 = 1; m1 <= 3; m1++) for (let m2 = m1; m2 <= 3; m2++) {
      const pontos = h1 + h2 + m1 + m2;
      if (pontos < REGRAS_SORTEIO.alvo || pontos > REGRAS_SORTEIO.maximo) continue;
      const consumo = [0, 0, 0, 0, 0, 0];
      consumo[h1 - 1]++; consumo[h2 - 1]++;
      consumo[m1 + 2]++; consumo[m2 + 2]++;
      padroes.push({ consumo, pontos });
    }
  }
  return embaralhar(padroes).sort((a, b) => a.pontos - b.pontos);
}

export function sortearTimes(atletas) {
  const base = atletas.map((j, i) => ({ ...j, nivel: normalizarNivel(j.nivel), __id: i }));
  const grupos = ["M", "F"].flatMap(genero =>
    [1, 2, 3].map(nivel => embaralhar(base.filter(j => j.genero === genero && j.nivel === nivel)))
  );
  const padroes = criarPadroes();
  const memo = new Map();
  function limite(contagens) {
    const homens = contagens[0] + contagens[1] + contagens[2];
    const mulheres = contagens[3] + contagens[4] + contagens[5];
    const pontos = contagens.reduce((s, n, i) => s + n * (i % 3 + 1), 0);
    return Math.min(Math.floor(homens / 2), Math.floor(mulheres / 2), Math.floor(pontos / REGRAS_SORTEIO.alvo));
  }
  function buscar(contagens) {
    const chave = contagens.join(",");
    if (memo.has(chave)) return memo.get(chave);
    const teto = limite(contagens);
    let melhor = { total: 0, padrao: null };
    if (teto > 0) for (const padrao of padroes) {
      if (padrao.consumo.some((n, i) => n > contagens[i])) continue;
      const restante = contagens.map((n, i) => n - padrao.consumo[i]);
      if (1 + limite(restante) <= melhor.total) continue;
      const total = 1 + buscar(restante).total;
      if (total > melhor.total) melhor = { total, padrao };
      if (melhor.total === teto) break;
    }
    memo.set(chave, melhor);
    return melhor;
  }
  let contagens = grupos.map(g => g.length);
  const equipes = [];
  for (let escolha = buscar(contagens); escolha.padrao; escolha = buscar(contagens)) {
    const equipe = [];
    escolha.padrao.consumo.forEach((n, i) => {
      for (let j = 0; j < n; j++) equipe.push(grupos[i].pop());
    });
    equipes.push(equipe);
    contagens = contagens.map((n, i) => n - escolha.padrao.consumo[i]);
  }
  const pontos = equipes.map(pontuacao);
  const equilibrio = pontos.length ? Math.round(Math.min(...pontos) / Math.max(...pontos) * 1000) / 10 : 0;
  const usados = new Set(equipes.flat().map(j => j.__id));
  const limpar = ({ __id, ...j }) => j;
  const times = embaralhar(equipes).map((equipe, i) => ({
    numero: i + 1,
    jogadores: embaralhar(equipe).map(limpar),
    pontos: pontuacao(equipe),
    equilibrio
  }));
  return {
    ok: true,
    times,
    fila: base.filter(j => !usados.has(j.__id)).map(limpar),
    equilibrio,
    pontos: times.map(t => t.pontos)
  };
}
