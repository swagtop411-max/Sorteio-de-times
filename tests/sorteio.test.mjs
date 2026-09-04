import test from "node:test";
import assert from "node:assert/strict";
import { sortearTimes } from "../js/sorteio.js";

const rng = () => 0.25;

test("quarteto de 8 pontos é válido quando não existe arranjo de 9", () => {
  const resultado = sortearTimes([
    { nome: "M1", genero: "M", nivel: 2 },
    { nome: "M2", genero: "M", nivel: 2 },
    { nome: "F1", genero: "F", nivel: 2 },
    { nome: "F2", genero: "F", nivel: 2 },
  ], { rng, maxTentativas: 10 });
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.pontos, [8]);
});

test("dois times chegam a 9 quando a composição permite", () => {
  const resultado = sortearTimes([
    { nome: "M1", genero: "M", nivel: 3 },
    { nome: "M2", genero: "M", nivel: 2 },
    { nome: "M3", genero: "M", nivel: 3 },
    { nome: "M4", genero: "M", nivel: 2 },
    { nome: "F1", genero: "F", nivel: 2 },
    { nome: "F2", genero: "F", nivel: 2 },
    { nome: "F3", genero: "F", nivel: 2 },
    { nome: "F4", genero: "F", nivel: 2 },
  ], { rng, maxTentativas: 50 });
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.pontos, [9, 9]);
  assert.equal(resultado.equilibrio, 100);
});

test("não monta time com dois avançados", () => {
  const resultado = sortearTimes([
    { nome: "M1", genero: "M", nivel: 3 },
    { nome: "M2", genero: "M", nivel: 3 },
    { nome: "F1", genero: "F", nivel: 2 },
    { nome: "F2", genero: "F", nivel: 2 },
  ], { rng });
  assert.equal(resultado.ok, false);
});
