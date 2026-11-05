const supabaseUrl = "https://aojfuxckuzqruwpdvzfp.supabase.co";
const supabaseKey = "sb_publishable_JU98QeFXyrFfhzp66UBKrQ_Q_bwupvW";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const myLoginForm = document.getElementById("login-form");
const myLoginContainer = document.getElementById("login-container");
const myMain = document.getElementById("app-container");
const myUserSpan = document.getElementById("user-name");
const myLogout = document.getElementById("logout-btn");
const myThemeBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");
const myConselho = document.querySelector("#quote-widget span");
const myDespesaForm = document.getElementById("expense-form");
const myList = document.getElementById("expense-list");

let listaDespesas = [];
let categoriaFiltroAtivo = "all";
const registeredUser = localStorage.getItem("user");

let temaInicial = "light";
if (registeredUser) {
  temaInicial = localStorage.getItem(registeredUser + "_theme") || "light";
} else {
  temaInicial = localStorage.getItem("theme") || "light";
}
document.documentElement.setAttribute("data-theme", temaInicial);

if (myLoginForm) {
  myLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const dataFromForm = new FormData(this);
    const myUserName = dataFromForm.get("username");
    if (myUserName != "") {
      localStorage.setItem("user", myUserName);
      let userTheme = localStorage.getItem(myUserName + "_theme") || "light";
      localStorage.setItem(myUserName + "_theme", userTheme);

      myUserSpan.textContent = myUserName;
      document.documentElement.setAttribute("data-theme", userTheme);
      myMain.classList.remove("hidden");
      myLoginContainer.classList.add("hidden");
      carregarDespesas();
      obterConselho();
    }
  });
}

function obterConselho() {
  fetch("https://api.adviceslip.com/advice")
    .then((response) => response.json())
    .then((data) => {
      const conselhoEmIngles = data.slip.advice;
      //console.log("Original: " + conselhoEmIngles);

      const params = new URLSearchParams({
        q: conselhoEmIngles,
        langpair: "en|pt",
      });
      return fetch(`https://api.mymemory.translated.net/get?${params}`);
    })
    .then((responseTraducao) => responseTraducao.json())
    .then((dataTraducao) => {
      const traducao = dataTraducao.responseData.translatedText;
      // console.log("Traduzido: " + traducao);
      if (myConselho) {
        myConselho.textContent = '"' + traducao + '"';
      }
    })
    .catch((erro) => {
      console.error("Erro no processo do conselho:", erro);
      // Mensagem de contingência caso a internet ou as APIs falhem
      if (myConselho) {
        myConselho.textContent =
          '"Não te esqueças de planear as tuas despesas com cabeça!"';
      }
    });
}

if (registeredUser) {
  const userTheme = localStorage.getItem(registeredUser + "_theme") || "light";
  myUserSpan.textContent = registeredUser;
  document.documentElement.setAttribute("data-theme", userTheme);
  myMain.classList.remove("hidden");
  myLoginContainer.classList.add("hidden");
  obterConselho();
  carregarDespesas();
}

function atualizarDataHora() {
  const elementoData = document.querySelector(".relogio-data");
  const elementoHora = document.querySelector(".relogio-hora");

  if (elementoData && elementoHora) {
    const agora = new Date();

    const dataFormatada = agora.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const horaFormatada = agora.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    elementoData.textContent = dataFormatada;
    elementoHora.textContent = horaFormatada;
  }
}

// Inicia imediatamente e define o ciclo de 1 segundo
atualizarDataHora();
setInterval(atualizarDataHora, 1000);

if (myThemeBtn) {
  myThemeBtn.addEventListener("click", () => {
    const myCurrentTheme = document.documentElement.getAttribute("data-theme");
    let newTheme;

    if (myCurrentTheme === "dark") {
      newTheme = "light";
    } else {
      newTheme = "dark";
    }
    document.documentElement.setAttribute("data-theme", newTheme);

    const currentUser = localStorage.getItem("user");
    if (currentUser) {
      localStorage.setItem(currentUser + "_theme", newTheme);
    }
  });
}

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
} else {
  document.documentElement.setAttribute("data-theme", "light");
}

if (myLogout) {
  myLogout.addEventListener("click", function () {
    localStorage.removeItem("user");
    document.documentElement.setAttribute("data-theme", "light");
    alert("Logout com sucesso");
    myMain.classList.add("hidden");
    myLoginContainer.classList.remove("hidden");
  });
}

// carregar dados do Supabase
async function carregarDespesas() {
  const { data, error } = await supabaseClient
    .from("despesas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar dados:", error);
    return;
  }

  // Mapear os dados que vêm do Supabase ("data")
  listaDespesas = data.map((item) => ({
    id: item.id,
    descricao: item.descricao,
    valor: parseFloat(item.valor),
    categoriaValor: item.categoria_valor,
    categoriaTexto: item.categoria_texto,
    criadoPor: item.criado_por,
  }));

  actualizarDespesas(listaDespesas);
}

if (myDespesaForm) {
  myDespesaForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const myDescricao = document.getElementById("expense-desc").value;
    const myValor = document.getElementById("expense-value").value;
    const myCategoria = document.getElementById("expense-category");

    const myCategoriaValor = myCategoria.value;
    const myCategoriaTexto =
      myCategoria.options[myCategoria.selectedIndex].text;
    const utilizadorActual = localStorage.getItem("user");

    const { error } = await supabaseClient.from("despesas").insert([
      {
        descricao: myDescricao,
        valor: parseFloat(myValor),
        categoria_valor: myCategoriaValor,
        categoria_texto: myCategoriaTexto,
        criado_por: utilizadorActual,
      },
    ]);

    if (error) {
      alert("Erro ao guardar no banco de dados!");
      console.error(error);
    } else {
      myDespesaForm.reset();
      carregarDespesas();
    }
  });
}

function actualizarDespesas(lista) {
  myList.innerHTML = "";
  let myValor = 0;

  lista.forEach(function (artigo) {
    if (
      categoriaFiltroAtivo !== "all" &&
      artigo.categoriaValor !== categoriaFiltroAtivo
    ) {
      return;
    }
    myValor += artigo.valor;

    const novaDespesa = document.createElement("tr");
    novaDespesa.dataset.id = artigo.id; // para guardar o ID na BD

    const celulaDescricao = document.createElement("td");
    celulaDescricao.setAttribute("data-label", "Descrição");
    celulaDescricao.textContent = artigo.descricao;

    const celulaValor = document.createElement("td");
    celulaValor.setAttribute("data-label", "Valor"); 
    celulaValor.textContent = artigo.valor.toFixed(2) + "€";

    const celulaCategoria = document.createElement("td");
    celulaCategoria.setAttribute("data-label", "Categoria"); 
    const myBadge = document.createElement("span");
    myBadge.className = "badge";
    myBadge.textContent = artigo.categoriaTexto;
    myBadge.classList.add("cat-" + artigo.categoriaValor.toLowerCase());
    celulaCategoria.appendChild(myBadge);

    const celulaCriador = document.createElement("td");
    celulaCriador.setAttribute("data-label", "Criado por"); 
    celulaCriador.textContent = artigo.criadoPor;

    const celulaAccoes = document.createElement("td");
    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-edit";
    btnEditar.textContent = "Editar";

    const btnApagar = document.createElement("button");
    btnApagar.className = "btn-delete";
    btnApagar.textContent = "Apagar";

    celulaAccoes.appendChild(btnEditar);
    celulaAccoes.appendChild(btnApagar);

    novaDespesa.appendChild(celulaDescricao);
    novaDespesa.appendChild(celulaValor);
    novaDespesa.appendChild(celulaCategoria);
    novaDespesa.appendChild(celulaCriador);
    novaDespesa.appendChild(celulaAccoes);
    myList.appendChild(novaDespesa);
  });

  const myValorTotal = document.getElementById("total-amount");
  if (myValorTotal) {
    myValorTotal.textContent = myValor.toFixed(2) + "€";
  }
}

if (myList) {
  myList.addEventListener("click", function (event) {
    const target = event.target;
    if (target.classList.contains("btn-edit")) editarLinha(target);
    if (target.classList.contains("btn-guardar")) guardarLinha(target);
    if (target.classList.contains("btn-cancelar")) cancelarLinha(target);
    if (target.classList.contains("btn-delete")) apagarLinha(target);
  });
}

function editarLinha(button) {
  const linha = button.closest("tr");
  const elemento = linha.querySelectorAll("td");
  const idBD = linha.dataset.id;

  const artigoOriginal = listaDespesas.find((item) => item.id == idBD);

  elemento[0].setAttribute("data-label", "Descrição");
  elemento[0].innerHTML = `<input type="text" value="${artigoOriginal.descricao}">`;

  elemento[1].setAttribute("data-label", "Valor");
  elemento[1].innerHTML = `<input type="number" step="0.01" value="${artigoOriginal.valor}">`;

  const categoriaAtual = artigoOriginal.categoriaValor || "";
  elemento[2].setAttribute("data-label", "Categoria");
  elemento[2].innerHTML = "";
  const mySelect = document.createElement("select");
  mySelect.className = "edit-categoria";

  const opcoes = [
    { valor: "Alimentacao", texto: "Alimentação" },
    { valor: "Educacao", texto: "Educação" },
    { valor: "Habitacao", texto: "Habitação" },
    { valor: "Transportes", texto: "Transportes" },
    { valor: "Lazer", texto: "Lazer" },
    { valor: "Outros", texto: "Outros" },
  ];

  opcoes.forEach(function (opcao) {
    const myOpcao = document.createElement("option");

    myOpcao.value = opcao.valor;
    myOpcao.textContent = opcao.texto;

    if (categoriaAtual === opcao.valor) myOpcao.selected = true;

    mySelect.appendChild(myOpcao);
  });

  elemento[2].appendChild(mySelect);

  const mudarBotoes = elemento[elemento.length - 1];
  mudarBotoes.innerHTML =
    '<button class="btn-guardar">Guardar</button><button class="btn-cancelar">Cancelar</button>';
}

async function guardarLinha(button) {
  const linha = button.closest("tr");
  const elemento = linha.querySelectorAll("td");
  const idBD = linha.dataset.id;

  const novaDescricao = elemento[0].querySelector("input").value;
  const novoPreco = parseFloat(elemento[1].querySelector("input").value) || 0;
  const selectCategoria = elemento[2].querySelector("select");
  const novaCategoriaValor = selectCategoria.value;
  const novaCategoriaTexto =
    selectCategoria.options[selectCategoria.selectedIndex].text;

  const { error } = await supabaseClient
    .from("despesas")
    .update({
      descricao: novaDescricao,
      valor: novoPreco,
      categoria_valor: novaCategoriaValor,
      categoria_texto: novaCategoriaTexto,
    })
    .eq("id", idBD);

  if (error) {
    alert("Erro ao atualizar despesa");
    console.error(error);
  } else {
    carregarDespesas();
  }
}

function cancelarLinha(button) {
  actualizarDespesas(listaDespesas);
}

async function apagarLinha(button) {
  if (!confirm("Tem a certeza que deseja apagar esta despesa?")) return;

  const linha = button.closest("tr");
  const idBD = linha.dataset.id;

  const { error } = await supabaseClient
    .from("despesas")
    .delete()
    .eq("id", idBD);

  if (error) {
    alert("Erro ao apagar despesa do Supabase.");
    console.error(error);
  } else {
    carregarDespesas();
  }
}

const selectFiltro = document.getElementById("filter-category");
if (selectFiltro) {
  selectFiltro.addEventListener("change", function (event) {
    categoriaFiltroAtivo = event.target.value;
    actualizarDespesas(listaDespesas);
  });
}


