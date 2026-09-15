# Checkpoint e teste 3H + 1M

Checkpoint: `checkpoint-2026-09-15-2h2m`
Commit estável: `40c203b7dba24122f98d9823e5c6344b133fd4c4`

## Versão oficial preservada
Os arquivos existentes do app principal não são modificados por este teste.
- 2 homens + 2 mulheres por time.
- Níveis: iniciante 1, intermediário 2, avançado 3.
- Meta de 9 pontos; teto de 10; equipes abaixo de 9 permitidas.
- Sem limite de avançados.
- Máximo de equipes; depois melhor equilíbrio; sobras na fila.

## Teste
Abra `/Sorteio-de-times/teste-3h1m/`.
A única diferença das regras é a composição: 3 homens + 1 mulher.
A lista de atletas é copiada do documento oficial por leitura (`getDoc`).
Cadastros, exclusões, resultados e fila deste teste são salvos exclusivamente
no localStorage `mm-volei-teste-3h1m-v1`, neste navegador.
Nenhum `setDoc`, `updateDoc` ou `deleteDoc` é usado pela página experimental.
O botão Copiar atletas substitui somente a cópia local do teste.
O QR abre o teste, mas não transfere os resultados locais a outro dispositivo.
Limpar dados do navegador remove os resultados locais do teste.

## WhatsApp
Exportar prepara um PNG identificado como TESTE 3H + 1M.
Em aparelhos compatíveis, Compartilhar imagem abre o seletor do sistema:
o usuário escolhe WhatsApp e destinatário.
Baixar e abrir meu WhatsApp baixa o PNG e abre `https://wa.me/5516988586327`.
É necessário anexar o arquivo baixado e confirmar o envio.
O recurso não envia mensagens automaticamente e não tem acesso à conta WhatsApp.

## Voltar
Para usar as regras oficiais agora, basta abrir `/Sorteio-de-times/`.
Não é necessário desfazer código nem restaurar dados: a versão oficial continua 2H + 2M.
Se alterações futuras exigirem recuperação, usar os arquivos da branch
`checkpoint-2026-09-15-2h2m` em um novo commit, após comparar as mudanças.
Evitar force-push ou reset do histórico compartilhado.
Este checkpoint guarda o código; não é uma cópia do banco Firestore.
