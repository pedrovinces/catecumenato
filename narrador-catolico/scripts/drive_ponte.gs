// Ponte do Narrador Católico (Google Apps Script, gratuito).
// Entrega um token de acesso ao Google Drive para o envio automático dos episódios (scripts/drive_enviar.py).
// Troque a chave abaixo por uma sequência longa de letras e números, sem espaços; ela vai na URL guardada no ambiente da nuvem.
const CHAVE = 'TROQUE-ESTA-CHAVE';

function doGet(e) {
  const ok = CHAVE !== 'TROQUE-ESTA-CHAVE' && e && e.parameter && e.parameter.chave === CHAVE;
  const resposta = ok ? { token: ScriptApp.getOAuthToken() } : { erro: 'chave inválida' };
  return ContentService.createTextOutput(JSON.stringify(resposta)).setMimeType(ContentService.MimeType.JSON);
}

// Rode esta função uma vez, no editor, para autorizar o acesso ao Drive.
function autorizar() {
  DriveApp.getRootFolder();
}
