const CHAVE_STORAGE = 'placarRummikub.v1';

// estado persistente
let estado = { jogadores: [], rodadas: [], proximoId: 1 };

// estado temporário da rodada em andamento (não é salvo)
let rodadaAtual = { vencedorId: null, pecas: {} };

const elementoTabela = document.getElementById('tabelaJogadores');
const elementoHistorico = document.getElementById('listaHistorico');
const campoNome = document.getElementById('campoNomeJogador');
const elementoMensagem = document.getElementById('mensagem');

/* ---------- persistência ---------- */

function salvar() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
  } catch (e) {
    /* sem storage disponível: o placar funciona só em memória */
  }
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
    if (salvo && Array.isArray(salvo.jogadores) && Array.isArray(salvo.rodadas)) {
      estado = salvo;
    }
  } catch (e) {
    /* dados inválidos: começa do zero */
  }
}

/* ---------- mensagens ---------- */

function mostrarMensagem(texto, tipo) {
  elementoMensagem.textContent = texto;
  elementoMensagem.className = 'mensagem' + (tipo ? ' mensagem--' + tipo : '');
}

/* ---------- jogadores ---------- */

function criarJogador() {
  const nome = campoNome.value.trim();

  if (nome === '') {
    mostrarMensagem('Informe o nome do jogador.', 'erro');
    return;
  }
  const jaExiste = estado.jogadores.some(
    (j) => j.nome.toLowerCase() === nome.toLowerCase()
  );
  if (jaExiste) {
    mostrarMensagem('Já existe um jogador chamado "' + nome + '".', 'erro');
    return;
  }

  estado.jogadores.push({ id: estado.proximoId++, nome: nome, vitorias: 0, pontos: 0 });
  campoNome.value = '';
  campoNome.focus();
  mostrarMensagem('', '');
  salvar();
  exibirNaTela();
}

function removerJogador(id) {
  const jogador = estado.jogadores.find((j) => j.id === id);
  if (!jogador || !confirm('Remover ' + jogador.nome + '?')) return;

  estado.jogadores = estado.jogadores.filter((j) => j.id !== id);
  delete rodadaAtual.pecas[id];
  if (rodadaAtual.vencedorId === id) rodadaAtual.vencedorId = null;
  salvar();
  exibirNaTela();
}

function apagarJogadores() {
  if (estado.jogadores.length === 0) return;
  if (!confirm('Apagar todos os jogadores e o histórico?')) return;

  estado = { jogadores: [], rodadas: [], proximoId: 1 };
  rodadaAtual = { vencedorId: null, pecas: {} };
  mostrarMensagem('', '');
  salvar();
  exibirNaTela();
}

function zerarPlacar() {
  if (estado.rodadas.length === 0 && estado.jogadores.every((j) => j.pontos === 0 && j.vitorias === 0)) return;
  if (!confirm('Zerar pontos, vitórias e histórico de todos os jogadores?')) return;

  estado.jogadores.forEach((j) => { j.pontos = 0; j.vitorias = 0; });
  estado.rodadas = [];
  rodadaAtual = { vencedorId: null, pecas: {} };
  mostrarMensagem('Placar zerado.', 'ok');
  salvar();
  exibirNaTela();
}

/* ---------- rodada ---------- */

function selecionarVencedor(id) {
  rodadaAtual.vencedorId = id;
  delete rodadaAtual.pecas[id]; // o vencedor não tem peças a somar
  exibirNaTela();
}

function finalizarRodada() {
  if (estado.jogadores.length < 2) {
    mostrarMensagem('Adicione pelo menos 2 jogadores.', 'erro');
    return;
  }
  if (rodadaAtual.vencedorId === null) {
    mostrarMensagem('Marque quem venceu a rodada.', 'erro');
    return;
  }

  const vencedor = estado.jogadores.find((j) => j.id === rodadaAtual.vencedorId);
  const perdedores = estado.jogadores.filter((j) => j.id !== vencedor.id);
  const deltas = {};
  let soma = 0;

  for (const perdedor of perdedores) {
    const bruto = rodadaAtual.pecas[perdedor.id];
    const valor = Number(bruto);
    if (bruto === undefined || bruto === '' || !Number.isInteger(valor) || valor < 0) {
      mostrarMensagem('Informe as peças restantes de ' + perdedor.nome + ' (número inteiro, 0 ou mais).', 'erro');
      return;
    }
    deltas[perdedor.id] = -valor; // quem perdeu subtrai o que sobrou na mão
    soma += valor;
  }
  deltas[vencedor.id] = soma; // quem venceu soma o total dos perdedores

  estado.jogadores.forEach((j) => {
    if (deltas[j.id] !== undefined) j.pontos += deltas[j.id];
  });
  vencedor.vitorias++;

  estado.rodadas.push({
    numero: estado.rodadas.length + 1,
    vencedorId: vencedor.id,
    vencedorNome: vencedor.nome,
    soma: soma,
    deltas: deltas,
    nomes: Object.fromEntries(estado.jogadores.map((j) => [j.id, j.nome]))
  });

  rodadaAtual = { vencedorId: null, pecas: {} };
  mostrarMensagem('Rodada ' + estado.rodadas.length + ' registrada: ' + vencedor.nome + ' ganhou ' + soma + ' pontos.', 'ok');
  salvar();
  exibirNaTela();
}

function desfazerUltimaRodada() {
  const rodada = estado.rodadas.pop();
  if (!rodada) {
    mostrarMensagem('Não há rodada para desfazer.', 'erro');
    return;
  }

  estado.jogadores.forEach((j) => {
    if (rodada.deltas[j.id] !== undefined) j.pontos -= rodada.deltas[j.id];
    if (j.id === rodada.vencedorId) j.vitorias = Math.max(0, j.vitorias - 1);
  });

  mostrarMensagem('Rodada ' + rodada.numero + ' desfeita.', 'ok');
  salvar();
  exibirNaTela();
}

/* ---------- renderização ---------- */

function celula(conteudo, classe) {
  const td = document.createElement('td');
  if (classe) td.className = classe;
  if (conteudo instanceof Node) td.appendChild(conteudo);
  else td.textContent = conteudo;
  return td;
}

function formatarPontos(n) {
  return n > 0 ? '+' + n : String(n);
}

function exibirNaTela() {
  elementoTabela.replaceChildren();

  if (estado.jogadores.length === 0) {
    const tr = document.createElement('tr');
    const td = celula('Nenhum jogador ainda. Adicione os jogadores para começar.', 'vazio');
    td.colSpan = 6;
    tr.appendChild(td);
    elementoTabela.appendChild(tr);
  }

  estado.jogadores.forEach((jogador) => {
    const tr = document.createElement('tr');
    const ehVencedor = rodadaAtual.vencedorId === jogador.id;
    if (ehVencedor) tr.className = 'linha-vencedor';

    // peças restantes
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.inputMode = 'numeric';
    input.className = 'input__pecas';
    input.setAttribute('aria-label', 'Peças restantes de ' + jogador.nome);
    if (ehVencedor) {
      input.disabled = true;
      input.placeholder = '—';
    } else {
      input.placeholder = '0';
      const guardado = rodadaAtual.pecas[jogador.id];
      if (guardado !== undefined) input.value = guardado;
      input.addEventListener('input', () => { rodadaAtual.pecas[jogador.id] = input.value; });
    }

    // vencedor
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'vencedor';
    radio.checked = ehVencedor;
    radio.setAttribute('aria-label', jogador.nome + ' venceu a rodada');
    radio.addEventListener('change', () => selecionarVencedor(jogador.id));

    // remover
    const botaoRemover = document.createElement('button');
    botaoRemover.type = 'button';
    botaoRemover.textContent = 'Remover';
    botaoRemover.addEventListener('click', () => removerJogador(jogador.id));

    const classePontos = jogador.pontos > 0 ? 'positivo' : jogador.pontos < 0 ? 'negativo' : '';

    tr.appendChild(celula(jogador.nome, 'nome'));
    tr.appendChild(celula(String(jogador.vitorias)));
    tr.appendChild(celula(formatarPontos(jogador.pontos), 'total ' + classePontos));
    tr.appendChild(celula(input));
    tr.appendChild(celula(radio));
    tr.appendChild(celula(botaoRemover));
    elementoTabela.appendChild(tr);
  });

  exibirHistorico();
}

function exibirHistorico() {
  elementoHistorico.replaceChildren();

  if (estado.rodadas.length === 0) {
    const li = document.createElement('li');
    li.className = 'vazio';
    li.textContent = 'Nenhuma rodada registrada.';
    elementoHistorico.appendChild(li);
    return;
  }

  // mais recente primeiro
  [...estado.rodadas].reverse().forEach((rodada) => {
    const li = document.createElement('li');
    const detalhes = Object.entries(rodada.deltas)
      .map(([id, delta]) => (rodada.nomes[id] || 'Jogador removido') + ' ' + formatarPontos(delta))
      .join(' · ');
    li.textContent = 'Rodada ' + rodada.numero + ' — ' + rodada.vencedorNome + ' venceu. ' + detalhes;
    elementoHistorico.appendChild(li);
  });
}

/* ---------- eventos ---------- */

document.getElementById('botaoAdicionar').addEventListener('click', criarJogador);
document.getElementById('botaoFinalizar').addEventListener('click', finalizarRodada);
document.getElementById('botaoDesfazer').addEventListener('click', desfazerUltimaRodada);
document.getElementById('botaoZerar').addEventListener('click', zerarPlacar);
document.getElementById('botaoApagar').addEventListener('click', apagarJogadores);
campoNome.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') criarJogador();
});

carregar();
exibirNaTela();
