export const WHATSAPP_NUMERO = "5516988586327";

export function configurarExportacao({ botao, obterTimes, obterArea, dialogo }) {
  const $ = id => document.getElementById(id);
  let arquivo = null, previewUrl = null;
  const hint = $("exportHint");
  function limpar() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null; arquivo = null;
    $("exportPreview").removeAttribute("src");
  }
  dialogo.addEventListener("close", limpar);
  $("btnFecharExport").onclick = () => dialogo.close();
  botao.onclick = async () => {
    if (!obterTimes().length) { alert("Faça um sorteio antes de exportar."); return; }
    if (botao.disabled) return;
    botao.disabled = true;
    try {
      limpar();
      const canvas = await html2canvas(obterArea(), { backgroundColor: "#fff", scale: 2 });
      const blob = await new Promise((resolve, reject) => canvas.toBlob(
        b => b ? resolve(b) : reject(new Error("Falha ao gerar PNG")), "image/png"
      ));
      arquivo = new File([blob], "times-teste-3h1m.png", { type: "image/png" });
      previewUrl = URL.createObjectURL(arquivo);
      $("exportPreview").src = previewUrl;
      let podeCompartilhar = false;
      try { podeCompartilhar = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] })); } catch {}
      $("btnCompartilhar").hidden = !podeCompartilhar;
      hint.textContent = podeCompartilhar
        ? "Toque em Compartilhar imagem e selecione WhatsApp e o destinatário. Para abrir diretamente seu número, use Baixar e abrir meu WhatsApp."
        : "Este navegador não compartilha arquivos diretamente. Baixe a imagem e abra seu WhatsApp para anexá-la.";
      dialogo.showModal();
    } catch (e) {
      console.error("Falha ao exportar imagem", e);
      limpar();
      alert("Não foi possível gerar a imagem. Tente novamente.");
    } finally { botao.disabled = false; }
  };
  // A imagem já está pronta: a chamada ocorre no gesto do usuário, como
  // exigido pela Web Share API. O sistema escolhe app e destinatário.
  $("btnCompartilhar").onclick = async () => {
    if (!arquivo) return;
    const btn = $("btnCompartilhar"); btn.disabled = true;
    try {
      await navigator.share({ files: [arquivo], title: "Times de teste • 3H + 1M" });
      dialogo.close();
    } catch (e) {
      if (e.name !== "AbortError") hint.textContent = "Não foi possível compartilhar. Use Baixar e abrir meu WhatsApp e anexe a imagem.";
    } finally { btn.disabled = false; }
  };
  $("btnWhatsApp").onclick = () => {
    if (!arquivo || !previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl; a.download = arquivo.name;
    document.body.appendChild(a); a.click(); a.remove();
    const texto = encodeURIComponent("Times de teste • 3 homens + 1 mulher • M&M Vôlei Pro");
    window.open("https://wa.me/" + WHATSAPP_NUMERO + "?text=" + texto, "_blank", "noopener,noreferrer");
    hint.textContent = "A imagem foi preparada para download. Anexe times-teste-3h1m.png na conversa do WhatsApp e confirme o envio.";
  };
}
