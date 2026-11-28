// Ponte do Narrador Católico (Google Apps Script, gratuito).
// Entrega um token de acesso ao Google Drive para o envio automático dos episódios (scripts/drive_enviar.py).
// Troque a chave abaixo por uma sequência longa de letras e números, sem espaços; ela vai na URL guardada no ambiente da nuvem.
const CHAVE = 'TROQUE-ESTA-CHAVE';

function doGet(e) {
  const recebida = (e && e.parameter && e.parameter.chave) || '';
  const trocada = CHAVE !== 'TROQUE-ESTA-CHAVE';
  if (trocada && recebida === CHAVE) {
    return json({ token: ScriptApp.getOAuthToken() });
  }
  // diagnóstico sem mostrar a chave: versão em uso, se a chave do código foi trocada e os tamanhos comparados
  return json({
    erro: 'chave inválida',
    versao: 2,
    chave_no_codigo_trocada: trocada,
    tamanho_esperado: CHAVE.length,
    tamanho_recebido: recebida.length,
    parametros: Object.keys((e && e.parameter) || {}),
  });
}

function json(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

// Manifesto: copie scripts/drive_ponte.appsscript.json para o appsscript.json do projeto (Configurações do projeto >
// "Mostrar o arquivo de manifesto"). Ele fixa o escopo de escrita no Drive; sem isso o token pode sair só de leitura.
// Rode esta função uma vez, no editor, para autorizar o acesso ao Drive (leitura e escrita).
// A linha do createFile nunca roda; ela existe para o Google pedir a permissão de escrita, sem a qual o envio é recusado.
function autorizar() {
  DriveApp.getRootFolder();
  if (false) DriveApp.createFile('teste', 'teste');
}
