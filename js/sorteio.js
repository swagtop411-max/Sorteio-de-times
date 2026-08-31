export const REGRAS_SORTEIO = {
  homensPorTime: 2,
  mulheresPorTime: 2,
  totalPorTime: 4,
  alvo: 9,
  maximo: 10,
  maxAvancados: 1,
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

function avancados(time) {
  return time.filter(j => normalizarNivel(j.nivel) === 3).length;
}

function valido(time, aplicarRegraAvancado = true) {
  return time.length === 4 &&
    time.filter(j => j.genero === "M").length === 2 &&
    time.filter(j => j.genero === "F").length === 2 &&
    pontuacao(time) <= REGRAS_SORTEIO.maximo &&
    (!aplicarRegraAvancado || avancados(time) <= REGRAS_SORTEIO.maxAvancados);
}

function criarCandidatos(homens, mulheres, aplicarRegraAvancado = true) {
  const candidatos = [];
  for (let a = 0; a < homens.length; a++) {
    for (let b = a + 1; b < homens.length; b++) {
      for (let c = 0; c < mulheres.length; c++) {
        for (let d = c + 1; d < mulheres.length; d++) {
          const time = [homens[a], homens[b], mulheres[c], mulheres[d]];
          if (valido(time, aplicarRegraAvancado) && (pontuacao(time) === 9 || pontuacao(time) === 10)) {
            candidatos.push({ time, pontos: pontuacao(time) });
          }
        }
      }
    }
  }
  return embaralhar(candidatos);
}

function escolherMelhor(candidatos, usados, alvo) {
  let melhor = null;
  let melhorScore = Infinity;
  for (const c of candidatos) {
    if (c.time.some(j => usados.has(j.__id))) continue;
    const excessoAlvo = Math.abs(c.pontos - alvo);
    const score = excessoAlvo * 10 + (c.pontos === 9 ? 0 : 1) + Math.random();
    if (score < melhorScore) {
      melhorScore = score;
      melhor = c;
    }
  }
  return melhor;
}

function construir(homens, mulheres, qtd, candidatos) {
  if (!candidatos.length) return null;

  const usados = new Set();
  const resultado = [];
  for (let i = 0; i < qtd; i++) {
    const melhor = escolherMelhor(candidatos, usados, REGRAS_SORTEIO.alvo);
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

export function sortearTimes(atletas) {
  const base = atletas.map((j, i) => ({ ...j, nivel: normalizarNivel(j.nivel), __id: j.__id ?? i }));
  const homens = base.filter(j => j.genero === "M");
  const mulheres = base.filter(j => j.genero === "F");
  const qtd = Math.floor(Math.min(homens.length / 2, mulheres.length / 2));
  const totalAvancados = base.filter(j => normalizarNivel(j.nivel) === 3).length;
  const aplicarRegraAvancado = totalAvancados > 0;

  if (qtd < 1) {
    return { ok: false, erro: "É necessário ter pelo menos 2 homens e 2 mulheres.", times: [], fila: base, equilibrio: 0 };
  }

  const candidatos = criarCandidatos(homens, mulheres, aplicarRegraAvancado);
  // A regra de 1 Avançado por time só é aplicada quando existe pelo menos
  // um Avançado entre os atletas. Sem Avançados, o sorteio segue normalmente,
  // mantendo as demais regras de composição, pontuação e equilíbrio.
  // Tenta várias ordens para encontrar a melhor combinação. 9 pontos é sempre prioridade.
  let melhor = null;
  for (let tentativa = 0; tentativa < 2500; tentativa++) {
    const h = embaralhar(homens);
    const m = embaralhar(mulheres);
    const r = construir(h, m, qtd, candidatos);
    if (!r) continue;
    const score = r.pontos.reduce((s, p) => s + Math.abs(REGRAS_SORTEIO.alvo - p), 0);
    if (!melhor || score < melhor.score || (score === melhor.score && r.equilibrio > melhor.equilibrio)) {
      melhor = { ...r, score };
      if (score === 0 && r.equilibrio === 100) break;
    }
  }

  if (!melhor) {
    return {
      ok: false,
      erro: aplicarRegraAvancado
        ? "Não foi possível montar times com as regras atuais. Verifique a quantidade de Avançados e a composição dos atletas disponíveis."
        : "Não foi possível montar times com a composição atual de atletas. Tente novamente ou ajuste a quantidade de atletas.",
      times: [],
      fila: base,
      equilibrio: 0
    };
  }

  const times = melhor.resultado.map((jogadores, i) => ({
    numero: i + 1,
    jogadores: jogadores.map(({ __id, ...j }) => j),
    pontos: pontuacao(jogadores),
    equilibrio: melhor.equilibrio
  }));
  const usados = new Set([...melhor.usados]);
  const fila = base.filter(j => !usados.has(j.__id)).map(({ __id, ...j }) => j);

  return {
    ok: true,
    times,
    fila,
    equilibrio: Math.round(melhor.equilibrio * 10) / 10,
    pontos: times.map(t => t.pontos)
  };
}
