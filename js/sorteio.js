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

// Com os critérios atuais (9 ou 10 pontos e no máximo 1 avançado),
// cada equipe válida tem exatamente 1 avançado e 3 intermediários.
// Contar essas duas composições por gênero encontra o máximo de equipes,
// sem depender de tentativas aleatórias nem exigir que todos participem.
export function sortearTimes(atletas) {
  const base = atletas.map((j, i) => ({ ...j, nivel: normalizarNivel(j.nivel), __id: i }));
  const grupo = (genero, nivel) => embaralhar(base.filter(j => j.genero === genero && j.nivel === nivel));
  const ha = grupo("M", 3), hi = grupo("M", 2);
  const ma = grupo("F", 3), mi = grupo("F", 2);
  let melhor = { homensAvancados: 0, mulheresAvancadas: 0, total: 0 };
  for (let h = 0; h <= Math.min(ha.length, hi.length, Math.floor(mi.length / 2)); h++) {
    const m = Math.min(ma.length, Math.floor((hi.length - h) / 2), mi.length - 2 * h);
    const total = h + m;
    if (total > melhor.total || (total === melhor.total && Math.random() < 0.5)) {
      melhor = { homensAvancados: h, mulheresAvancadas: m, total };
    }
  }
  const equipes = [];
  for (let i = 0; i < melhor.homensAvancados; i++) equipes.push([ha.pop(), hi.pop(), mi.pop(), mi.pop()]);
  for (let i = 0; i < melhor.mulheresAvancadas; i++) equipes.push([hi.pop(), hi.pop(), ma.pop(), mi.pop()]);
  const usados = new Set(equipes.flat().map(j => j.__id));
  const limpar = ({ __id, ...j }) => j;
  const times = embaralhar(equipes).map((equipe, i) => ({
    numero: i + 1,
    jogadores: embaralhar(equipe).map(limpar),
    pontos: pontuacao(equipe),
    equilibrio: 100
  }));
  return {
    ok: true,
    times,
    fila: base.filter(j => !usados.has(j.__id)).map(limpar),
    equilibrio: times.length ? 100 : 0,
    pontos: times.map(t => t.pontos)
  };
}
