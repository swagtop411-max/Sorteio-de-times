export const REGRAS_SORTEIO = {
  homensPorTime: 2,
  mulheresPorTime: 2,
  totalPorTime: 4,
  alvo: 9,
  maximo: 10,
  equilibrioAlvo: 90
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

// 9 é uma meta, nunca um mínimo. A composição 2H+2M e o teto de 10
// são obrigatórios. Primeiro maximiza a participação, depois o equilíbrio.
function criarPadroes() {
  const padroes = [];
  for (let h1 = 1; h1 <= 3; h1++) for (let h2 = h1; h2 <= 3; h2++) {
    for (let m1 = 1; m1 <= 3; m1++) for (let m2 = m1; m2 <= 3; m2++) {
      const pontos = h1 + h2 + m1 + m2;
      if (pontos > REGRAS_SORTEIO.maximo) continue;
      const consumo = [0, 0, 0, 0, 0, 0];
      consumo[h1 - 1]++; consumo[h2 - 1]++;
      consumo[m1 + 2]++; consumo[m2 + 2]++;
      padroes.push({ consumo, pontos });
    }
  }
  return embaralhar(padroes).sort((a, b) =>
    Math.abs(a.pontos - REGRAS_SORTEIO.alvo) - Math.abs(b.pontos - REGRAS_SORTEIO.alvo)
  );
}

// Busca exata por seis contagens (gênero e nível), sem enumerar nomes.
// Os limites de pontos descartam buscas impossíveis antes de expandi-las.
function resolver(contagens, padroes, quantidade, minimo, maximo) {
  const falhas = new Set();
  function extremo(c, quantidadePorGenero, maior) {
    let soma = 0;
    for (const inicio of [0, 3]) {
      let faltam = quantidadePorGenero;
      for (const nivel of (maior ? [3, 2, 1] : [1, 2, 3])) {
        const n = Math.min(faltam, c[inicio + nivel - 1]);
        soma += n * nivel; faltam -= n;
      }
      if (faltam) return null;
    }
    return soma;
  }
  function buscar(c, faltam) {
    if (!faltam) return [];
    const chave = c.join(",") + ":" + faltam;
    if (falhas.has(chave)) return null;
    const menorSoma = extremo(c, 2 * faltam, false);
    const maiorSoma = extremo(c, 2 * faltam, true);
    if (menorSoma === null || menorSoma > maximo * faltam || maiorSoma < minimo * faltam) return null;
    for (const padrao of padroes) {
      if (padrao.consumo.some((n, i) => n > c[i])) continue;
      const restante = c.map((n, i) => n - padrao.consumo[i]);
      const resultado = buscar(restante, faltam - 1);
      if (resultado !== null) return [padrao, ...resultado];
    }
    falhas.add(chave);
    return null;
  }
  return buscar(contagens, quantidade);
}

export function sortearTimes(atletas) {
  const base = atletas.map((j, i) => ({ ...j, nivel: normalizarNivel(j.nivel), __id: i }));
  const grupos = ["M", "F"].flatMap(genero =>
    [1, 2, 3].map(nivel => embaralhar(base.filter(j => j.genero === genero && j.nivel === nivel)))
  );
  const contagens = grupos.map(g => g.length);
  const padroes = criarPadroes();
  let quantidade = Math.min(
    Math.floor((contagens[0] + contagens[1] + contagens[2]) / 2),
    Math.floor((contagens[3] + contagens[4] + contagens[5]) / 2)
  );
  let escolhidos = null;
  while (quantidade > 0) {
    escolhidos = resolver(contagens, padroes, quantidade, 4, REGRAS_SORTEIO.maximo);
    if (escolhidos !== null) break;
    quantidade--;
  }
  escolhidos = escolhidos || [];
  if (quantidade) {
    const faixas = [];
    for (let min = 4; min <= REGRAS_SORTEIO.maximo; min++) {
      for (let max = min; max <= REGRAS_SORTEIO.maximo; max++) faixas.push({ min, max });
    }
    faixas.sort((a, b) => b.min / b.max - a.min / a.max ||
      Math.abs((a.min + a.max) / 2 - REGRAS_SORTEIO.alvo) -
      Math.abs((b.min + b.max) / 2 - REGRAS_SORTEIO.alvo));
    for (const faixa of faixas) {
      const candidatos = padroes.filter(p => p.pontos >= faixa.min && p.pontos <= faixa.max);
      if (!candidatos.length) continue;
      const resultado = resolver(contagens, candidatos, quantidade, faixa.min, faixa.max);
      if (resultado !== null) { escolhidos = resultado; break; }
    }
  }
  const equipes = escolhidos.map(padrao => {
    const equipe = [];
    padrao.consumo.forEach((n, i) => {
      for (let j = 0; j < n; j++) equipe.push(grupos[i].pop());
    });
    return equipe;
  });
  const pontos = equipes.map(pontuacao);
  const equilibrio = pontos.length ? Math.round(Math.min(...pontos) / Math.max(...pontos) * 1000) / 10 : 0;
  const usados = new Set(equipes.flat().map(j => j.__id));
  const limpar = ({ __id, ...j }) => j;
  const times = embaralhar(equipes).map((equipe, i) => ({
    numero: i + 1, jogadores: embaralhar(equipe).map(limpar),
    pontos: pontuacao(equipe), equilibrio
  }));
  return {
    ok: true, times,
    fila: base.filter(j => !usados.has(j.__id)).map(limpar),
    equilibrio, pontos: times.map(t => t.pontos)
  };
}
