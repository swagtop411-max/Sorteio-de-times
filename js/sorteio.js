export const REGRAS_SORTEIO = Object.freeze({
  homensPorTime: 2,
  mulheresPorTime: 2,
  totalPorTime: 4,
  alvo: 9,
  maximo: 10,
  maxAvancados: 1,
  equilibrioMinimo: 90
});

export function normalizarNivel(valor) {
  const v = String(valor ?? "").trim().toLowerCase();
  if (v === "iniciante" || v === "1") return 1;
  if (v === "intermediário" || v === "intermediario" || v === "2") return 2;
  if (v === "avançado" || v === "avancado" || v === "3") return 3;
  throw new TypeError(`Nível inválido: ${valor}`);
}

export function nomeNivel(nivel) {
  return ["", "Iniciante", "Intermediário", "Avançado"][normalizarNivel(nivel)];
}

function embaralhar(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pontuacao(time) {
  return time.reduce((s, j) => s + normalizarNivel(j.nivel), 0);
}

function avancados(time) {
  return time.filter(j => normalizarNivel(j.nivel) === 3).length;
}

function valido(time) {
  return time.length === REGRAS_SORTEIO.totalPorTime &&
    time.filter(j => j.genero === "M").length === REGRAS_SORTEIO.homensPorTime &&
    time.filter(j => j.genero === "F").length === REGRAS_SORTEIO.mulheresPorTime &&
    pontuacao(time) <= REGRAS_SORTEIO.maximo &&
    avancados(time) <= REGRAS_SORTEIO.maxAvancados;
}

function criarCandidatos(homens, mulheres, rng) {
  const candidatos = [];
  for (let a = 0; a < homens.length; a++) {
    for (let b = a + 1; b < homens.length; b++) {
      for (let c = 0; c < mulheres.length; c++) {
        for (let d = c + 1; d < mulheres.length; d++) {
          const time = [homens[a], homens[b], mulheres[c], mulheres[d]];
          if (valido(time)) candidatos.push({ time, pontos: pontuacao(time) });
        }
      }
    }
  }
  return embaralhar(candidatos, rng);
}

function escolherMelhor(candidatos, usados, alvo, rng) {
  let melhor = null;
  let melhorScore = Infinity;
  for (const c of candidatos) {
    if (c.time.some(j => usados.has(j.__id))) continue;
    const score = Math.abs(c.pontos - alvo) * 100 + rng();
    if (score < melhorScore) {
      melhorScore = score;
      melhor = c;
    }
  }
  return melhor;
}

function construir(qtd, candidatos, rng) {
  if (!candidatos.length) return null;
  const usados = new Set();
  const resultado = [];
  for (let i = 0; i < qtd; i++) {
    const melhor = escolherMelhor(candidatos, usados, REGRAS_SORTEIO.alvo, rng);
    if (!melhor) return null;
    resultado.push(melhor.time);
    melhor.time.forEach(j => usados.add(j.__id));
  }

  const pontos = resultado.map(pontuacao);
  const max = Math.max(...pontos);
  const min = Math.min(...pontos);
  const equilibrio = max ? (min / max) * 100 : 100;
  if (equilibrio < REGRAS_SORTEIO.equilibrioMinimo) return null;
  return { resultado, usados, pontos, equilibrio };
}

function prepararAtletas(atletas) {
  if (!Array.isArray(atletas)) throw new TypeError("A lista de atletas deve ser um array.");
  return atletas.map((j, i) => {
    const nome = String(j?.nome ?? "").trim();
    const genero = String(j?.genero ?? "").trim().toUpperCase();
    if (!nome) throw new TypeError(`Atleta ${i + 1} sem nome.`);
    if (genero !== "M" && genero !== "F") throw new TypeError(`Gênero inválido para ${nome}. Use M ou F.`);
    return { ...j, nome, genero, nivel: normalizarNivel(j?.nivel), __id: j?.__id ?? j?.uid ?? i };
  });
}

export function sortearTimes(atletas, { rng = Math.random, maxTentativas = 2500 } = {}) {
  const base = prepararAtletas(atletas);
  const homens = base.filter(j => j.genero === "M");
  const mulheres = base.filter(j => j.genero === "F");
  const qtd = Math.floor(Math.min(homens.length / 2, mulheres.length / 2));

  if (qtd < 1) {
    return { ok: false, erro: "É necessário ter pelo menos 2 homens e 2 mulheres.", times: [], fila: base.map(({ __id, ...j }) => j), equilibrio: 0 };
  }

  const candidatos = criarCandidatos(homens, mulheres, rng);
  if (!candidatos.length) {
    return { ok: false, erro: "Não existe quarteto válido com a composição atual. Verifique níveis e quantidade de atletas Avançados.", times: [], fila: base.map(({ __id, ...j }) => j), equilibrio: 0 };
  }

  let melhor = null;
  for (let tentativa = 0; tentativa < Math.max(1, Number(maxTentativas) || 1); tentativa++) {
    const r = construir(qtd, embaralhar(candidatos, rng), rng);
    if (!r) continue;
    const score = r.pontos.reduce((s, p) => s + Math.abs(REGRAS_SORTEIO.alvo - p), 0);
    if (!melhor || score < melhor.score || (score === melhor.score && r.equilibrio > melhor.equilibrio)) {
      melhor = { ...r, score };
      if (score === 0 && r.equilibrio === 100) break;
    }
  }

  if (!melhor) {
    return { ok: false, erro: "Não foi possível montar todos os times mantendo pelo menos 90% de equilíbrio.", times: [], fila: base.map(({ __id, ...j }) => j), equilibrio: 0 };
  }

  const times = melhor.resultado.map((jogadores, i) => ({
    numero: i + 1,
    jogadores: jogadores.map(({ __id, ...j }) => j),
    pontos: pontuacao(jogadores)
  }));
  const fila = base.filter(j => !melhor.usados.has(j.__id)).map(({ __id, ...j }) => j);

  return {
    ok: true,
    times,
    fila,
    equilibrio: Math.round(melhor.equilibrio * 10) / 10,
    pontos: times.map(t => t.pontos)
  };
}
