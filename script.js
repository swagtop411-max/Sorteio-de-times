let jogadores = [];

function adicionarJogador() {
  const nome = document.getElementById("nome").value;
  const genero = document.getElementById("genero").value;
  const nivel = parseInt(document.getElementById("nivel").value);

  jogadores.push({ nome, genero, nivel });

  atualizarLista();
}

function atualizarLista() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  jogadores.forEach(j => {
    const li = document.createElement("li");
    li.textContent = `${j.nome} - ${j.genero} - Nível ${j.nivel}`;
    lista.appendChild(li);
  });
}

function embaralhar(array) {
  return array.sort(() => Math.random() - 0.5);
}

function sortearTimes() {
  let homens = jogadores.filter(j => j.genero === "M");
  let mulheres = jogadores.filter(j => j.genero === "F");

  homens = embaralhar(homens);
  mulheres = embaralhar(mulheres);

  const totalTimes = Math.floor(Math.min(homens.length / 2, mulheres.length / 2));

  let times = [];

  for (let i = 0; i < totalTimes; i++) {
    let time = [];

    time.push(homens.pop());
    time.push(homens.pop());
    time.push(mulheres.pop());
    time.push(mulheres.pop());

    times.push(time);
  }

  // balanceamento simples por nível
  times.sort((a, b) => media(b) - media(a));

  mostrarTimes(times);
}

function media(time) {
  return time.reduce((acc, j) => acc + j.nivel, 0);
}

function mostrarTimes(times) {
  const div = document.getElementById("times");
  div.innerHTML = "";

  times.forEach((time, i) => {
    let html = `<div><h3>Time ${i + 1}</h3>`;

    time.forEach(j => {
      html += `<p>${j.nome} (N${j.nivel})</p>`;
    });

    html += `<strong>Média: ${media(time)}</strong></div>`;

    div.innerHTML += html;
  });
}
