function sortearTimes() {
  let homens = jogadores.filter(j => j.genero === "M");
  let mulheres = jogadores.filter(j => j.genero === "F");

  if (homens.length < 2 || mulheres.length < 2) {
    alert("Precisa de pelo menos 2 homens e 2 mulheres!");
    return;
  }

  homens.sort((a, b) => b.nivel - a.nivel);
  mulheres.sort((a, b) => b.nivel - a.nivel);

  const totalTimes = Math.floor(Math.min(homens.length / 2, mulheres.length / 2));
  let times = Array.from({ length: totalTimes }, () => []);

  let i = 0;

  // distribui homens
  homens.forEach(j => {
    times[i % totalTimes].push(j);
    i++;
  });

  i = 0;

  // distribui mulheres
  mulheres.forEach(j => {
    times[i % totalTimes].push(j);
    i++;
  });

  mostrarTimes(times);
}
