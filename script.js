var listaDeJogadores = [];
var elementoTabela = document.getElementById('tabelaJogadores');

function exibirNaTela() {
    elementoTabela.innerHTML = "";
    listaDeJogadores.forEach((jogador, index) => {

    elementoTabela.innerHTML += `
            <tr>
            <td>${jogador.nome}</td>
            <td>${jogador.vitoria}</td>
            <td><input id="quantidade" type="number" placeholder="100" class="input__jogador">
                <button onClick="adicionarValor(${index})">OK</button></td>
            <td>${jogador.pontos}</td>
            <td><button onClick="adicionarVitoria(${index})">Vitória</button></td>
            <td><button onClick="limparPontuacaoJogador(${index})">Limpar pontos</button></td>
            <td><button onClick="removerJogador(${index})">Remover jogador</button></td>
            </tr>
    `;
    });
}

function criarJogador() {
    //verificar se player ja existe ou não
    var nomeNovoJogador = document.getElementById("campoNomeJogador").value;
    if(nomeNovoJogador == '') {
      alert('Informe o nome do Jogador');
      return;
  }
    listaDeJogadores.push({
      nome: nomeNovoJogador,
      vitoria: 0,
      pontos: 0
    });
    document.getElementById("campoNomeJogador").value = "";
    exibirNaTela();
  }

function adicionarVitoria(index) {
    listaDeJogadores[index].vitoria++;
    exibirNaTela();
}

function adicionarValor(index) {
    let quantidade = parseInt(document.getElementById('quantidade').value);
      
        listaDeJogadores[index].pontos = listaDeJogadores[index].pontos + quantidade;
        if (quantidade == '') {
          alert("informe pontuação");
          return;
      }
    exibirNaTela();

}
function limparPontuacaoJogador(index) {
    listaDeJogadores[index].vitoria = 0;
    listaDeJogadores[index].pontos = 0;
    exibirNaTela();
  }

  function removerJogador(index) {
    listaDeJogadores.splice(index, 1);
    exibirNaTela();
  }
  
  function apagarJogadores() {
    listaDeJogadores = [];
    exibirNaTela();
  }