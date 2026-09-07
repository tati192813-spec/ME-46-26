document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("category-select")
    .addEventListener("change", filterTabs);

  document.querySelectorAll(".posit-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      showContent(e.target.dataset.target, e.target);
    });
  });

  document
    .querySelector(".window-container")
    .addEventListener("change", (e) => {
      const target = e.target;
      if (target.tagName !== "INPUT") return;

      if (target.id.startsWith("check-tots-idees-")) {
        const fila = target.id.split("-").pop();
        seleccionarTotsIdees(target, fila);
        comprobarOcultarError();
        return;
      }

      const contentPanel = target.closest(".content-panel");
      if (!contentPanel) return;

      const blocId = contentPanel.id.split("-")[1];

      if (target.id === `check-tots-${blocId}`) {
        seleccionarTots(target, blocId);
      } else if (target.classList.contains("unitat-item")) {
        verificarTots(blocId);
      } else if (target.id === `check-tots-apartats-${blocId}`) {
        seleccionarTotsApartats(target, blocId);
      } else if (target.classList.contains("apartat-item")) {
        canviApartat(blocId);
      } else if (target.id === `check-tots-punts-${blocId}`) {
        seleccionarTotsPunts(target, blocId);
      } else if (target.classList.contains("punt-item")) {
        canviPunt(blocId);
      } else if (target.id === `check-tots-subpunts-${blocId}`) {
        seleccionarTotsSubpunts(target, blocId);
      } else if (target.classList.contains("subpunt-item")) {
        canviSubpunt(blocId);
      }

      comprobarOcultarError();
    });

  document.querySelector(".window-container").addEventListener("click", (e) => {
    const target = e.target;
    let haCambiadoAlgo = false;

    const btnAny = target.closest(".any-item");

    if (target.classList.contains("btn-simple")) {
      target.classList.toggle("selected");
      haCambiadoAlgo = true;
    } else if (target.id === "btn-tots-anys") {
      toggleTotsAnys();
      haCambiadoAlgo = true;
    } else if (btnAny) {
      toggleAny(btnAny);
      haCambiadoAlgo = true;
    } else if (target.classList.contains("btn-redonda")) {
      toggleBola(target);
      haCambiadoAlgo = true;
    } else if (target.classList.contains("item-simulacre")) {
      target.classList.toggle("selected");
      const items = document.querySelectorAll(".item-simulacre");
      const btnGlobal = document.getElementById("btn-simulacre-global");
      const todosSeleccionados = Array.from(items).every((btn) =>
        btn.classList.contains("selected"),
      );
      if (todosSeleccionados) {
        btnGlobal.classList.add("selected");
      } else {
        btnGlobal.classList.remove("selected");
      }
      haCambiadoAlgo = true;
    }

    if (haCambiadoAlgo) {
      setTimeout(comprobarOcultarError, 50);
    }
  });

  filterTabs();
  actualizarEstadisticasTotales();
});

let testActualState = {
  preguntas: [],
  respuestasUsuario: {},
  estadosPreguntas: [],
  indiceActual: 0,
  modo: "estudi",
};

let intervaloCronometro;
let tiempoSegundos = 0;

function iniciarTest() {
  const activePanel = document.querySelector(".content-panel.active");
  let errorMsg = document.getElementById("error-msg");

  if (!errorMsg) {
    errorMsg = document.createElement("p");
    errorMsg.id = "error-msg";
    const btnComenzar = document.querySelector(".btn-comenzar");
    btnComenzar.parentElement.insertBefore(errorMsg, btnComenzar);
  }

  const estilBase =
    "color: #ff4d4d; font-weight: bold; display: block; margin-bottom: 15px; margin-top: 15px; text-transform: uppercase; text-align: center;";
  const estilInline =
    "color: #ff4d4d; font-weight: bold; display: inline-block; margin: 0 0 0 15px; text-transform: uppercase; font-size: 13px;";

  errorMsg.style.display = "none";

  const msgBlanc = document.getElementById("msg-blanc-estudi");
  if (msgBlanc) msgBlanc.style.display = "none";

  const dinamicaSeleccionada = document.getElementById("tipo-dinamica").value;

  const bloqueoActivo = localStorage.getItem("bloqueoErroresMossos") === "true";
  if (
    bloqueoActivo &&
    (dinamicaSeleccionada === "XX" || dinamicaSeleccionada === "BB")
  ) {
    errorMsg.style.cssText = estilBase;
    errorMsg.innerHTML =
      "⚠️ TENS MASSA ERRORS ACUMULATS (30+).<br>Has de deixar la llista de repàs a zero abans de fer nous tests per afiançar coneixements.";
    errorMsg.style.display = "block";
    errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (dinamicaSeleccionada === "PDF") {
    window.llistaPdfs = [];
    window.indexPdfActual = 0;

    if (activePanel && activePanel.id.startsWith("bloc-")) {
      const unitatsMarcades = activePanel.querySelectorAll(
        ".unitat-item:checked",
      );

      if (unitatsMarcades.length === 0) {
        errorMsg.style.cssText = estilBase;
        errorMsg.innerText =
          "Per veure el PDF, has de seleccionar al menys UNA unitat.";
        errorMsg.style.display = "block";
        return;
      }

      const rutesTemari = {
        a1: "A1.pdf",
        a2: "A2.pdf",
        a3: "A3.pdf",
        a4: "A4.pdf",
        a5: "A5.pdf",
        a6: "A6.pdf",
        a7: "A7.pdf",
        b1: "B1.pdf",
        b2: "B2.pdf",
        b3: "B3.pdf",
        b4: "B4.pdf",
        b5: "B5.pdf",
        b6: "B6.pdf",
        b7: "B7.pdf",
        b8: "B8.pdf",
        c1: "C1.pdf",
        c2: "C2.pdf",
        c3: "C3.pdf",
        c4: "C4.pdf",
        c5: "C5.pdf",
      };

      unitatsMarcades.forEach((u) => {
        const idUnitat = u.value.toLowerCase();
        const lletraBloc = idUnitat.charAt(0).toUpperCase();
        const nomArxiu =
          rutesTemari[idUnitat] || `${idUnitat.toUpperCase()}.pdf`;
        window.llistaPdfs.push({
          ruta: `TEMARI/BLOC ${lletraBloc}/${nomArxiu}`,
          titol: `TEMARI - Unitat ${idUnitat.toUpperCase()}`,
        });
      });
    } else if (activePanel && activePanel.id === "idees-content") {
      const ideesMarcades = activePanel.querySelectorAll(
        ".btn-redonda.selected",
      );

      if (ideesMarcades.length === 0) {
        errorMsg.style.cssText = estilBase;
        errorMsg.innerText =
          "Per veure el PDF, has de seleccionar al menys UNA idea de força.";
        errorMsg.style.display = "block";
        return;
      }

      const rutesIdees = {
        a1: "A1.IF.pdf",
        a2: "A2.IF.pdf",
        a3: "A3.IF.pdf",
        a4: "A4.IF.pdf",
        a5: "A5.IF.pdf",
        a6: "A6.IF.pdf",
        a7: "A7.IF.pdf",
        b1: "B1.IF.pdf",
        b2: "B2.IF.pdf",
        b3: "B3.IF.pdf",
        b4: "B4.IF.pdf",
        b5: "B5.IF.pdf",
        b6: "B6.IF.pdf",
        b7: "B7.IF.pdf",
        b8: "B8.IF.pdf",
        c1: "C1.IF.pdf",
        c2: "C2.IF.pdf",
        c3: "C3.IF.pdf",
        c4: "C4.IF.pdf",
        c5: "C5.IF.pdf",
      };

      ideesMarcades.forEach((idea) => {
        const idIdea = idea.childNodes[0].nodeValue.trim().toLowerCase();
        const lletraBloc = idIdea.charAt(0).toUpperCase();
        const nomArxiu = rutesIdees[idIdea] || `${idIdea.toUpperCase()}.IF.pdf`;
        window.llistaPdfs.push({
          ruta: `TEMARI/IF_${lletraBloc}/${nomArxiu}`,
          titol: `IDEES FORÇA - Tema ${idIdea.toUpperCase()}`,
        });
      });
    } else {
      errorMsg.style.cssText = estilBase;
      errorMsg.innerText =
        "La dinàmica TEMARI (PDF) només funciona seleccionant Unitats o Idees de força.";
      errorMsg.style.display = "block";
      return;
    }

    document.getElementById("footer-actions").style.display = "none";
    document.querySelector(".toolbar").style.display = "none";
    document.querySelector(".titol-principal").style.display = "none";
    document.querySelectorAll(".content-panel").forEach((p) => {
      p.classList.remove("active");
      p.setAttribute("aria-hidden", "true");
    });

    carregarPdfActual();

    const panelPdf = document.getElementById("pdf-visor-content");
    panelPdf.classList.add("active");
    panelPdf.setAttribute("aria-hidden", "false");
    panelPdf.focus();

    return;
  }

  if (activePanel && activePanel.id.startsWith("bloc-")) {
    const blocId = activePanel.id.split("-")[1];
    const unitatsMarcades = activePanel.querySelectorAll(
      ".unitat-item:checked",
    );

    if (unitatsMarcades.length === 0) {
      errorMsg.style.cssText = estilBase;
      errorMsg.innerText = "Mínim cal escollir una unitat per començar";
      activePanel
        .querySelector(".cabecera-unitats")
        .insertAdjacentElement("afterend", errorMsg);
      errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (unitatsMarcades.length === 1) {
      const containerApartats = document.getElementById(
        `dynamic-apartats-${blocId}`,
      );
      if (containerApartats) {
        const apartatsMarcats = containerApartats.querySelectorAll(
          ".apartat-item:checked",
        );

        if (apartatsMarcats.length === 0) {
          errorMsg.style.cssText = estilInline;
          errorMsg.innerText =
            "Mínim cal escollir un apartat o seleccionar una altra unitat";
          containerApartats
            .querySelector(".tots-checkbox")
            .appendChild(errorMsg);
          errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        if (apartatsMarcats.length === 1) {
          const containerPunts = document.getElementById(
            `dynamic-punts-${blocId}`,
          );
          if (containerPunts) {
            const puntsMarcats =
              containerPunts.querySelectorAll(".punt-item:checked");

            if (puntsMarcats.length === 0) {
              errorMsg.style.cssText = estilInline;
              errorMsg.innerText =
                "Mínim cal escollir un punt o seleccionar un altre apartat";
              containerPunts
                .querySelector(".tots-checkbox")
                .appendChild(errorMsg);
              errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }

            if (puntsMarcats.length === 1) {
              const containerSubpunts = document.getElementById(
                `dynamic-subpunts-${blocId}`,
              );
              if (containerSubpunts) {
                const subpuntsMarcats = containerSubpunts.querySelectorAll(
                  ".subpunt-item:checked",
                );

                if (subpuntsMarcats.length === 0) {
                  errorMsg.style.cssText = estilInline;
                  errorMsg.innerText =
                    "Mínim cal escollir un subpunt o seleccionar un altre punt";
                  containerSubpunts
                    .querySelector(".tots-checkbox")
                    .appendChild(errorMsg);
                  errorMsg.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  if (activePanel && activePanel.id === "idees-content") {
    const ideesMarcades = activePanel.querySelectorAll(".btn-redonda.selected");
    if (ideesMarcades.length === 0) {
      errorMsg.style.cssText = estilBase;
      errorMsg.innerText = "Mínim cal escollir una idea de força per començar";
      activePanel
        .querySelector(".cabecera-unitats")
        .insertAdjacentElement("afterend", errorMsg);
      errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  if (activePanel && activePanel.id === "simulacre-content") {
    const seleccionats = activePanel.querySelectorAll(
      ".btn-simulacre.selected",
    );
    if (seleccionats.length < 2) {
      errorMsg.style.cssText = estilBase;
      errorMsg.innerText = "Mínim cal escollir 2 opció per començar";
      activePanel
        .querySelector(".cabecera-unitats")
        .insertAdjacentElement("afterend", errorMsg);
      errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  if (activePanel && activePanel.id === "examens-content") {
    const anysSeleccionats = activePanel.querySelectorAll(
      ".btn-examen.selected",
    );
    if (anysSeleccionats.length === 0) {
      errorMsg.style.cssText = estilBase;
      errorMsg.innerText = "Mínim cal escollir un any per començar";
      activePanel
        .querySelector(".cabecera-unitats")
        .insertAdjacentElement("afterend", errorMsg);
      errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const containerModels = document.getElementById("models-container-examens");
    if (containerModels && containerModels.style.display === "block") {
      const ModelsSeleccionados = containerModels.querySelectorAll(
        ".btn-simple.selected",
      );
      if (ModelsSeleccionados.length === 0) {
        errorMsg.style.cssText = estilBase;
        errorMsg.innerText =
          "Atenció: Has de seleccionar al menys un model d'examen!";
        containerModels
          .querySelector("h3")
          .insertAdjacentElement("afterend", errorMsg);
        errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }

  if (dinamicaSeleccionada === "TT") {
    const preguntasParaTarjetas = filtrarPreguntas(baseDeDatosPreguntas);
    iniciarDinamicaTarjetas(preguntasParaTarjetas);
    return;
  }

  const classicUI = document.getElementById("classic-test-ui");
  const flashcardUI = document.getElementById("flashcard-ui");
  if (classicUI) classicUI.style.display = "block";
  if (flashcardUI) flashcardUI.style.display = "none";
  const seccionInterna = document.querySelector(
    "#classic-test-ui .seccion-interna",
  );
  if (seccionInterna) seccionInterna.style.display = "flex";
  const mapaPreg = document.getElementById("mapa-preguntas");
  if (mapaPreg) mapaPreg.style.display = "flex";

  const repasoEnd = document.getElementById("repaso-end-screen");
  if (repasoEnd) repasoEnd.style.display = "none";

  const preguntasFiltradas = filtrarPreguntas(baseDeDatosPreguntas);

  if (preguntasFiltradas.length === 0) {
    errorMsg.style.cssText = estilBase;
    errorMsg.innerText =
      "No hi ha preguntes disponibles per a la selecció actual.";
    errorMsg.style.display = "block";
    errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const numSelec = document.getElementById("num-preguntas").value;
  let totalPreguntas = preguntasFiltradas.length;
  if (numSelec !== "totes") {
    totalPreguntas = Math.min(parseInt(numSelec), totalPreguntas);
  }

  testActualState.preguntas = preguntasFiltradas.slice(0, totalPreguntas);
  testActualState.respuestasUsuario = {};
  testActualState.estadosPreguntas = new Array(totalPreguntas).fill("gris");
  testActualState.indiceActual = 0;
  testActualState.modo = dinamicaSeleccionada === "BB" ? "simulacre" : "estudi";

  testActualState.preguntas.forEach((p) => {
    let opcionesConIndice = p.opciones.map((op, idx) => ({
      texto: op,
      esCorrecta: idx === 0,
    }));
    p.opcionesAleatorias = mezclarArray(opcionesConIndice);
  });

  document.getElementById("footer-actions").style.display = "none";
  document.querySelector(".toolbar").style.display = "none";
  document.querySelector(".titol-principal").style.display = "none";
  document.querySelectorAll(".content-panel").forEach((p) => {
    p.classList.remove("active");
    p.setAttribute("aria-hidden", "true");
  });

  const panelTest = document.getElementById("test-content");
  panelTest.classList.add("active");
  panelTest.setAttribute("aria-hidden", "false");

  document.getElementById("test-mode-label").innerText =
    testActualState.modo === "simulacre" ? "SIMULACRE" : "ESTUDI";

  const crono = document.getElementById("test-cronometro");
  crono.style.display = "block";

  clearInterval(intervaloCronometro);

  if (testActualState.modo === "simulacre") {
    crono.style.color = "#C70A0A";
    tiempoSegundos = testActualState.preguntas.length * 70;
  } else {
    crono.style.color = "#44718D";
    tiempoSegundos = 0;
  }

  const formatearTiempo = (segs) => {
    let m = Math.floor(segs / 60)
      .toString()
      .padStart(2, "0");
    let s = (segs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  crono.innerText = formatearTiempo(tiempoSegundos);

  intervaloCronometro = setInterval(() => {
    if (testActualState.modo === "simulacre") {
      tiempoSegundos--;
      if (tiempoSegundos <= 0) {
        clearInterval(intervaloCronometro);
        tiempoSegundos = 0;
        ejecutarEntregaTest(true);
      }
    } else {
      tiempoSegundos++;
    }
    crono.innerText = formatearTiempo(tiempoSegundos);
  }, 1000);

  construirMapaPreguntas();
  cargarPreguntaEnPantalla(0);
}

function construirMapaPreguntas() {
  const container = document.getElementById("mapa-preguntas");
  container.innerHTML = "";

  testActualState.preguntas.forEach((_, index) => {
    const btnNum = document.createElement("button");
    btnNum.className = "btn-mapa-num mapa-gris";
    btnNum.innerText = index + 1;
    btnNum.onclick = () => cargarPreguntaEnPantalla(index);
    container.appendChild(btnNum);
  });
  actualizarEstilosMapa();
}

function cargarPreguntaEnPantalla(index) {
  testActualState.indiceActual = index;
  actualizarEstilosMapa();

  const p = testActualState.preguntas[index];

  let rutaInfo = "";
  if (p.tipo === "temari") {
    rutaInfo = `Bloc ${p.bloc.toUpperCase()}`;
    if (p.unitat) rutaInfo += ` • Unitat ${p.unitat.toUpperCase()}`;
    if (p.apartat) rutaInfo += ` • Apartat ${p.apartat.toUpperCase()}`;
    if (p.punt) rutaInfo += ` • Punt ${p.punt.toUpperCase()}`;
    if (p.subpunt) rutaInfo += ` • Subpunt ${p.subpunt.toUpperCase()}`;
  } else if (p.tipo === "idees") {
    rutaInfo = `Idees Força • Bloc ${p.bloc.toUpperCase()} • ${p.idea.toUpperCase()}`;
  } else if (p.tipo === "examens") {
    rutaInfo = `Exàmens Anteriors • Any ${p.any} • ${p.model}`;
  }
  document.getElementById("test-info-bloque").innerText = rutaInfo;

  document.getElementById("test-numero").innerText = `${index + 1}.`;
  document.getElementById("test-enunciado").innerText = p.pregunta;

  const containerOpciones = document.getElementById("test-opciones-container");
  containerOpciones.innerHTML = "";

  p.opcionesAleatorias.forEach((opObj, opIndex) => {
    const btnOp = document.createElement("button");
    btnOp.className = "btn-simple";
    btnOp.style.textAlign = "left";
    btnOp.style.fontWeight = "normal";
    btnOp.innerText = opObj.texto;
    btnOp.style.textTransform = "none";

    const respuestaGuardada = testActualState.respuestasUsuario[index];

    if (
      testActualState.modo === "revisio" ||
      ((testActualState.modo === "estudi" ||
        testActualState.modo === "repaso_errores") &&
        respuestaGuardada !== undefined)
    ) {
      btnOp.disabled = true;

      if (opObj.esCorrecta) {
        btnOp.style.backgroundColor = "#def7ec";
        btnOp.style.borderColor = "#03543f";
        btnOp.style.color = "#03543f";
      } else if (opIndex === respuestaGuardada && !opObj.esCorrecta) {
        btnOp.style.backgroundColor = "#fde8e8";
        btnOp.style.borderColor = "#9b1c1c";
        btnOp.style.color = "#9b1c1c";
      }
    } else if (
      testActualState.modo === "simulacre" &&
      respuestaGuardada === opIndex
    ) {
      btnOp.style.backgroundColor = "#2F62D0";
      btnOp.style.color = "#ffffff";
      btnOp.style.borderColor = "#000000";
    }

    if (
      testActualState.modo !== "revisio" &&
      !(testActualState.modo === "estudi" && respuestaGuardada !== undefined)
    ) {
      btnOp.onclick = () => seleccionarOpcion(opIndex, opObj.esCorrecta);
    }

    containerOpciones.appendChild(btnOp);
  });
}

function seleccionarOpcion(opIndex, esCorrecta) {
  const index = testActualState.indiceActual;
  const p = testActualState.preguntas[index];

  if (testActualState.modo === "repaso_errores") {
    testActualState.respuestasUsuario[index] = opIndex;
    testActualState.estadosPreguntas[index] = esCorrecta ? "verd" : "roig";
    cargarPreguntaEnPantalla(index);

    let errores = JSON.parse(localStorage.getItem("erroresMossos")) || [];

    if (esCorrecta) {
      errores = errores.filter((e) => e.pregunta !== p.pregunta);
      localStorage.setItem("erroresMossos", JSON.stringify(errores));
      actualizarBotonErrores();

      if (errores.length === 0) {
        localStorage.setItem("bloqueoErroresMossos", "false");
        setTimeout(() => {
          document.querySelector(
            "#classic-test-ui .seccion-interna",
          ).style.display = "none";
          document.getElementById("mapa-preguntas").style.display = "none";
          document.getElementById("repaso-end-screen").style.display = "flex";
        }, 500);
      }
    }

    return;
  }

  const msgError = document.getElementById("msg-blanc-estudi");
  if (msgError) msgError.style.display = "none";

  if (
    testActualState.modo === "simulacre" &&
    testActualState.respuestasUsuario[index] === opIndex
  ) {
    delete testActualState.respuestasUsuario[index];
    if (testActualState.respuestasCorrectasUsuario)
      delete testActualState.respuestasCorrectasUsuario[index];
    testActualState.estadosPreguntas[index] = "gris";
    cargarPreguntaEnPantalla(index);
    return;
  }

  testActualState.respuestasUsuario[index] = opIndex;
  testActualState.respuestasCorrectasUsuario =
    testActualState.respuestasCorrectasUsuario || {};
  testActualState.respuestasCorrectasUsuario[index] = esCorrecta;

  if (testActualState.modo === "estudi") {
    testActualState.estadosPreguntas[index] = esCorrecta ? "verd" : "roig";
    if (!esCorrecta) {
      guardarErrorUnico(p);
    }
    cargarPreguntaEnPantalla(index);
  } else if (testActualState.modo === "simulacre") {
    testActualState.estadosPreguntas[index] = "blau";
    cargarPreguntaEnPantalla(index);
  }
}

function actualizarEstilosMapa() {
  const botonesMapa = document.getElementById("mapa-preguntas").children;
  let botonActual = null;
  Array.from(botonesMapa).forEach((btn, index) => {
    btn.className = `btn-mapa-num mapa-${testActualState.estadosPreguntas[index]}`;
    if (index === testActualState.indiceActual) {
      btn.classList.add("mapa-actual");
      botonActual = btn;
    }
  });

  if (botonActual) {
    botonActual.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const btnAnterior = document.getElementById("btn-anterior");
  if (btnAnterior) {
    btnAnterior.style.visibility =
      testActualState.indiceActual === 0 ? "hidden" : "visible";
  }

  const btnSeg = document.getElementById("btn-siguiente-entregar");
  const btnEntregar = document.getElementById("btn-entregar-sempre");

  if (btnEntregar) btnEntregar.style.display = "none";

  if (testActualState.modo === "revisio") {
    btnSeg.innerText = "Sortir";
    btnSeg.style.backgroundColor = "#C70A0A";
    btnSeg.style.visibility = "visible";
  } else if (testActualState.modo === "repaso_errores") {
    btnSeg.style.visibility = "visible";
    if (testActualState.indiceActual === testActualState.preguntas.length - 1) {
      btnSeg.innerText = "Sortir";
      btnSeg.style.backgroundColor = "#C70A0A";
    } else {
      btnSeg.innerText = "Següent";
      btnSeg.style.backgroundColor = "#44718D";
    }
  } else {
    btnSeg.style.visibility = "visible";
    if (testActualState.indiceActual === testActualState.preguntas.length - 1) {
      btnSeg.innerText = "Entregar Test";
      btnSeg.style.backgroundColor = "#C70A0A";
    } else {
      btnSeg.innerText = "Següent";
      btnSeg.style.backgroundColor = "#44718D";
    }
  }
}

function intentarEntregarSempre() {
  if (testActualState.modo === "simulacre") {
    document.getElementById("modal-entregar").style.display = "flex";
  } else if (testActualState.modo === "estudi") {
    const total = testActualState.preguntas.length;
    let enBlanc = 0;
    for (let i = 0; i < total; i++) {
      if (testActualState.respuestasUsuario[i] === undefined) enBlanc++;
    }

    if (enBlanc > 0) {
      const msgError = document.getElementById("msg-blanc-estudi");
      if (msgError) {
        msgError.innerHTML = `⚠️ Has de respondre totes les preguntes abans d'entregar el Mode Estudi.<br>Et falten <b>${enBlanc} pregunta/es</b> per contestar.`;
        msgError.style.display = "block";
      }
    } else {
      ejecutarEntregaTest();
    }
  }
}

function navegarPregunta(direccion) {
  const msgError = document.getElementById("msg-blanc-estudi");
  if (msgError) msgError.style.display = "none";

  const nuevoIndice = testActualState.indiceActual + direccion;
  if (nuevoIndice >= 0 && nuevoIndice < testActualState.preguntas.length) {
    cargarPreguntaEnPantalla(nuevoIndice);
  } else if (nuevoIndice >= testActualState.preguntas.length) {
    if (
      testActualState.modo === "revisio" ||
      testActualState.modo === "repaso_errores"
    ) {
      cerrarTest(false);
    } else if (
      testActualState.modo === "estudi" ||
      testActualState.modo === "simulacre"
    ) {
      intentarEntregarSempre();
    }
  }
}

function cerrarModalEntregar() {
  document.getElementById("modal-entregar").style.display = "none";
}

function ejecutarEntregaTest(tiempoAgotado = false) {
  document.getElementById("modal-entregar").style.display = "none";
  clearInterval(intervaloCronometro);

  let c = 0;
  let i = 0;
  let b = 0;
  const n = testActualState.preguntas.length;
  const pm = 10;

  let htmlIncorrectes = [];
  let htmlEnBlanc = [];
  let htmlCorrectes = [];

  for (let idx = 0; idx < n; idx++) {
    const p = testActualState.preguntas[idx];
    const respostaIndice = testActualState.respuestasUsuario[idx];

    let esAcertada = false;
    if (respostaIndice !== undefined) {
      esAcertada = p.opcionesAleatorias[respostaIndice]
        ? p.opcionesAleatorias[respostaIndice].esCorrecta
        : false;
    }

    let estat = "";
    let colorBorder = "";
    let colorBg = "";
    let htmlTargeta = "";

    const textPregunta = p.pregunta;
    const textCorrecta = p.opcionesAleatorias.find((o) => o.esCorrecta).texto;

    if (respostaIndice === undefined) {
      b++;
      estat = "gris";
      colorBorder = "#7ba5bf";
      colorBg = "#ffffff";
      guardarErrorUnico(p);
    } else if (esAcertada) {
      c++;
      estat = "verd";
      colorBorder = "#03543f";
      colorBg = "#def7ec";
    } else {
      i++;
      estat = "roig";
      colorBorder = "#9b1c1c";
      colorBg = "#fde8e8";
      guardarErrorUnico(p);
    }

    testActualState.estadosPreguntas[idx] = estat;

    let textRespostaUsuari = "";
    if (estat === "gris") {
      textRespostaUsuari = "En blanc";
    } else if (estat === "verd") {
      textRespostaUsuari = textCorrecta;
    } else {
      textRespostaUsuari = p.opcionesAleatorias[respostaIndice].texto;
    }

    let explicacioCorreta =
      estat !== "verd"
        ? `<div style="font-size: 13px; color: #03543f; margin-bottom: 5px;"><b>Correcta:</b> ${textCorrecta}</div>`
        : "";

    htmlTargeta = `
                <div style="background: ${colorBg}; padding: 15px; border-radius: 6px; border: 2px solid ${colorBorder}; font-size: 14px; text-align: left; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="color: #000000; font-weight: bold; margin-bottom: 8px; font-size: 15px; line-height: 1.4;">${idx + 1}. ${textPregunta}</div>
                    ${explicacioCorreta}
                    <div style="font-size: 13px; color: ${colorBorder};"><b>Tu resposta:</b> ${textRespostaUsuari}</div>
                </div>`;

    if (estat === "roig") {
      htmlIncorrectes.push(htmlTargeta);
    } else if (estat === "gris") {
      htmlEnBlanc.push(htmlTargeta);
    } else {
      htmlCorrectes.push(htmlTargeta);
    }
  }

  let puntuacio = ((c - i / 4) * pm) / n;
  if (puntuacio < 0) puntuacio = 0;
  const aprovat = puntuacio >= 7.5;

  let tiempoTardadoSegundos = 0;
  if (testActualState.modo === "simulacre") {
    const tiempoTotalOriginal = testActualState.preguntas.length * 70;
    tiempoTardadoSegundos = tiempoTotalOriginal - tiempoSegundos;
  } else {
    tiempoTardadoSegundos = tiempoSegundos;
  }
  let minutos = Math.floor(tiempoTardadoSegundos / 60)
    .toString()
    .padStart(2, "0");
  let segundosRestantes = (tiempoTardadoSegundos % 60)
    .toString()
    .padStart(2, "0");
  let tiempoFormateado = `${minutos}:${segundosRestantes}`;

  document.getElementById("test-content").classList.remove("active");
  document.getElementById("test-content").setAttribute("aria-hidden", "true");

  const panelResultats = document.getElementById("resultats-content");
  panelResultats.classList.add("active");
  panelResultats.setAttribute("aria-hidden", "false");

  const titol = document.getElementById("nota-titol");
  const detalls = document.getElementById("nota-detalls");

  let textAprovatSupens = aprovat ? "APROVAT (>= 7,50)" : "SUSPENS (< 7,50)";
  let colorNotaFinal = aprovat ? "#03543f" : "#9b1c1c";

  if (tiempoAgotado) {
    titol.innerText = "FI DEL TEMPS! ⏳";
    titol.style.color = "#9b1c1c";
  } else {
    titol.innerText = "RESULTATS";
    titol.style.color = "#073E87";
  }

  let cajaBlancHTML = "";
  if (testActualState.modo === "simulacre") {
    cajaBlancHTML = `
                <div style="flex: 1; background-color: #ffffff; border: 2px solid #7ba5bf; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 12px; font-weight: bold; color: #44718D; text-transform: uppercase; margin-bottom: 5px;">En Blanc</div>
                    <div style="font-size: 28px; font-weight: 900; color: #44718D;">${b}</div>
                </div>`;
  }

  detalls.innerHTML = `
                <!-- Caja Nota Final -->
                <div style="background-color: #ffffff; border: 3px solid #000000; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 14px; font-weight: bold; color: #000000; text-transform: uppercase; margin-bottom: 5px;">NOTA FINAL (Temps: ${tiempoFormateado})</div>
                    <div style="font-size: 55px; font-weight: 900; color: ${colorNotaFinal}; margin-bottom: 5px;">${puntuacio.toFixed(2)}</div>
                    <div style="font-size: 15px; font-weight: bold; color: ${colorNotaFinal};">${textAprovatSupens}</div>
                </div>
                
                <!-- Cajas inferiores -->
                <div style="display: flex; gap: 15px; justify-content: space-between;">
                    <div style="flex: 1; background-color: #def7ec; border: 2px solid #03543f; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="font-size: 12px; font-weight: bold; color: #03543f; text-transform: uppercase; margin-bottom: 5px;">Correctes</div>
                        <div style="font-size: 28px; font-weight: 900; color: #03543f;">${c}</div>
                    </div>
                    <div style="flex: 1; background-color: #fde8e8; border: 2px solid #9b1c1c; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="font-size: 12px; font-weight: bold; color: #9b1c1c; text-transform: uppercase; margin-bottom: 5px;">Errors</div>
                        <div style="font-size: 28px; font-weight: 900; color: #9b1c1c;">${i}</div>
                    </div>
                    ${cajaBlancHTML}
                </div>
            `;

  let stats = JSON.parse(localStorage.getItem("estadisticasMossos")) || {
    fets: 0,
    aprovats: 0,
    correctes: 0,
    errors: 0,
    blanc: 0,
  };

  if (!stats.detall) {
    stats.detall = {
      a: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
      b: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
      c: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
      idees: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
      examens: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
    };
  } else {
    ["a", "b", "c", "idees", "examens"].forEach((k) => {
      if (!stats.detall[k].pregUniques) stats.detall[k].pregUniques = [];
    });
  }
  if (!stats.especific) stats.especific = {};

  stats.fets += 1;
  if (aprovat) stats.aprovats += 1;
  stats.correctes += c;
  stats.errors += i;
  stats.blanc += b;

  let counts = { a: 0, b: 0, c: 0, idees: 0, examens: 0 };

  testActualState.preguntas.forEach((p, idx) => {
    let cat = "";
    if (p.tipo === "examens") cat = "examens";
    else if (p.tipo === "idees") cat = "idees";
    else if (p.bloc === "a") cat = "a";
    else if (p.bloc === "b") cat = "b";
    else if (p.bloc === "c") cat = "c";

    counts[cat]++;

    if (!stats.detall[cat].pregUniques.includes(p.pregunta)) {
      stats.detall[cat].pregUniques.push(p.pregunta);
    }

    const esAcertada = testActualState.respuestasCorrectasUsuario
      ? testActualState.respuestasCorrectasUsuario[idx]
      : false;
    let key = "";
    if (p.tipo === "temari" && p.unitat) key = p.unitat.toLowerCase();
    else if (p.tipo === "idees" && p.idea) key = "idea-" + p.idea.toLowerCase();
    else if (p.tipo === "examens" && p.any && p.model)
      key = `ex-${p.any}-${p.model}`.toLowerCase();

    if (key) {
      if (!stats.especific[key])
        stats.especific[key] = { realitzades: 0, aciertos: 0, pregUniques: [] };
      if (!stats.especific[key].pregUniques)
        stats.especific[key].pregUniques = [];

      if (!stats.especific[key].pregUniques.includes(p.pregunta)) {
        stats.especific[key].pregUniques.push(p.pregunta);
      }
      stats.especific[key].realitzades += 1;
      if (esAcertada) stats.especific[key].aciertos += 1;
    }
  });

  let mainCat = Object.keys(counts).reduce((x, y) =>
    counts[x] > counts[y] ? x : y,
  );
  if (counts[mainCat] > 0) {
    stats.detall[mainCat].testsFets += 1;
    if (aprovat) stats.detall[mainCat].testsAprovats += 1;
  }

  localStorage.setItem("estadisticasMossos", JSON.stringify(stats));

  document.getElementById("llista-resultats").innerHTML =
    htmlIncorrectes.join("") + htmlEnBlanc.join("") + htmlCorrectes.join("");
}

function cargarEstadisticasLocales() {
  let stats = JSON.parse(localStorage.getItem("estadisticasMossos"));
  if (!stats) return;

  const graficos = document.querySelectorAll(
    ".stat-chart-inner span:first-child",
  );
  const wrappers = document.querySelectorAll(".stat-chart-wrapper");

  if (graficos.length >= 2 && wrappers.length >= 2) {
    const getColores = (pct) => {
      if (pct >= 75) return { bg: "#2ecc71", txt: "#03543f" };
      if (pct >= 50) return { bg: "#f39c12", txt: "#FF8000" };
      return { bg: "#e74c3c", txt: "#9b1c1c" };
    };

    let pctAprob =
      stats.fets > 0 ? Math.round((stats.aprovats / stats.fets) * 100) : 0;
    let colAprob = getColores(pctAprob);

    graficos[0].innerText = `${pctAprob}%`;
    graficos[0].style.color = colAprob.txt;
    graficos[0].style.fontSize = "18px";
    wrappers[0].style.background = `conic-gradient(${colAprob.bg} ${pctAprob * 3.6}deg, #e0e0e0 0deg)`;

    let totalBD =
      typeof baseDeDatosPreguntas !== "undefined"
        ? baseDeDatosPreguntas.length
        : 100;

    let unicasTotales = 0;
    if (stats.detall) {
      ["a", "b", "c", "idees", "examens"].forEach((cat) => {
        if (stats.detall[cat] && stats.detall[cat].pregUniques) {
          unicasTotales += stats.detall[cat].pregUniques.length;
        }
      });
    }

    let pctComp =
      totalBD > 0
        ? Math.min(Math.round((unicasTotales / totalBD) * 100), 100)
        : 0;
    let colComp = getColores(pctComp);

    graficos[1].innerText = `${pctComp}%`;
    graficos[1].style.color = colComp.txt;
    graficos[1].style.fontSize = "18px";
    wrappers[1].style.background = `conic-gradient(${colComp.bg} ${pctComp * 3.6}deg, #e0e0e0 0deg)`;
  }

  if (typeof actualizarEstadisticasTotales === "function") {
    actualizarEstadisticasTotales();
  }
}

function revisarPreguntaEspecifica(idx) {
  document.getElementById("resultats-content").classList.remove("active");
  document
    .getElementById("resultats-content")
    .setAttribute("aria-hidden", "true");

  const panelTest = document.getElementById("test-content");
  panelTest.classList.add("active");
  panelTest.setAttribute("aria-hidden", "false");

  testActualState.modo = "revisio";
  actualizarEstilosMapa();
  cargarPreguntaEnPantalla(idx);
  document.getElementById("test-mode-label").innerText = "REVISIÓ";
}

function confirmarSortir() {
  document.getElementById("modal-sortir").style.display = "flex";
}

function cerrarModalSortir() {
  document.getElementById("modal-sortir").style.display = "none";
}

function cerrarTest(forzado) {
  clearInterval(intervaloCronometro);
  document.getElementById("modal-sortir").style.display = "none";
  document.getElementById("modal-entregar").style.display = "none";

  document.getElementById("test-content").classList.remove("active");
  document.getElementById("test-content").setAttribute("aria-hidden", "true");

  const panelResultats = document.getElementById("resultats-content");
  if (panelResultats) {
    panelResultats.classList.remove("active");
    panelResultats.setAttribute("aria-hidden", "true");
  }

  document.getElementById("footer-actions").style.display = "flex";
  document.querySelector(".toolbar").style.display = "flex";
  document.querySelector(".titol-principal").style.display = "block";

  document.querySelectorAll(".content-panel").forEach((p) => {
    p.classList.remove("active");
    p.setAttribute("aria-hidden", "true");
  });

  const activeTab = document.querySelector(".posit-tab.active");
  if (activeTab) {
    const targetId = activeTab.getAttribute("data-target");
    const targetPanel = document.getElementById(`${targetId}-content`);
    if (targetPanel) {
      targetPanel.classList.add("active");
      targetPanel.setAttribute("aria-hidden", "false");
    }
  } else {
    filterTabs();
  }
}

function comprobarOcultarError() {
  const errorMsg = document.getElementById("error-msg");
  if (!errorMsg || errorMsg.style.display === "none") return;

  const activePanel = document.querySelector(".content-panel.active");
  if (!activePanel) return;

  let esValid = false;

  if (activePanel.id === "simulacre-content") {
    const seleccionats = activePanel.querySelectorAll(
      ".btn-simulacre.selected",
    );
    if (seleccionats.length >= 2) {
      esValid = true;
    }
  } else {
    esValid = true;
  }

  if (esValid) {
    errorMsg.style.display = "none";
  }
}

function resetearSelecciones() {
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((chk) => (chk.checked = false));
  document
    .querySelectorAll(".selected")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll(".sub-items-container")
    .forEach((el) => el.remove());

  ["a", "b", "c"].forEach((blocId) => {
    const unitats = document.querySelectorAll(
      `#unitats-${blocId} .unitat-item`,
    );
    unitats.forEach((u) => {
      const label = u.closest("label");
      if (label) label.style.display = "block";
    });
  });

  const modContainer = document.getElementById("models-container-examens");
  if (modContainer) modContainer.style.display = "none";
}

function cambiarVistaEstadisticas(tipo) {
  const btnGlobal = document.getElementById("btn-resum-global");
  const btnEspecific = document.getElementById("btn-resum-especific");
  const viewGlobal = document.getElementById("view-resum-global");
  const viewEspecific = document.getElementById("view-resum-especific");

  if (tipo === "global") {
    btnGlobal.classList.add("active");
    btnEspecific.classList.remove("active");
    viewGlobal.classList.add("active");
    viewEspecific.classList.remove("active");
    if (typeof cargarEstadisticasLocales === "function")
      cargarEstadisticasLocales();
  } else {
    btnEspecific.classList.add("active");
    btnGlobal.classList.remove("active");
    viewEspecific.classList.add("active");
    viewGlobal.classList.remove("active");
    actualizarEstilosEstadisticas();
  }
}

function cambiarTabEspecific(tabId, btnElement) {
  document
    .querySelectorAll(".btn-especific-tab")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".especific-content-box")
    .forEach((box) => box.classList.remove("active"));

  btnElement.classList.add("active");
  document.getElementById(`especific-${tabId}`).classList.add("active");
  actualizarEstilosEstadisticas();
}

function actualizarEstilosEstadisticas() {
  const filas = document.querySelectorAll(
    ".especific-list-row, .especific-sub-row",
  );

  filas.forEach((fila) => {
    const totals = parseFloat(fila.getAttribute("data-totals")) || 0;
    const realitzades = parseFloat(fila.getAttribute("data-realitzades")) || 0;
    const aciertos = parseFloat(fila.getAttribute("data-aciertos")) || 0;

    fila.classList.remove("estat-roig", "estat-groc", "estat-verd");

    if (totals === 0) {
      fila.classList.add("estat-groc");
      return;
    }

    const percentatgeRealitzacio = (realitzades / totals) * 100;

    if (
      percentatgeRealitzacio < 70 ||
      (percentatgeRealitzacio >= 70 && aciertos <= 60)
    ) {
      fila.classList.add("estat-roig");
    } else if (percentatgeRealitzacio > 70 && aciertos >= 85) {
      fila.classList.add("estat-verd");
    } else {
      fila.classList.add("estat-groc");
    }
  });
}

function filterTabs() {
  resetearSelecciones();
  const selectValue = document.getElementById("category-select").value;
  const tabs = document.querySelectorAll(".posit-tab");
  const contentPanels = document.querySelectorAll(".content-panel");
  const footer = document.getElementById("footer-actions");

  const dinamicaSelect = document.getElementById("tipo-dinamica");
  const optionTargetes = dinamicaSelect.querySelector('option[value="TT"]');
  const optionPdf = dinamicaSelect.querySelector('option[value="PDF"]');

  if (selectValue === "simulacre") {
    if (optionTargetes) optionTargetes.style.display = "block";
    if (optionPdf) optionPdf.style.display = "none";

    if (dinamicaSelect.value === "PDF") {
      dinamicaSelect.value = "XX";
      cambiarInterfazDinamica();
    }
  } else {
    if (optionTargetes) optionTargetes.style.display = "block";
    if (optionPdf) optionPdf.style.display = "block";
  }

  tabs.forEach((tab) => {
    tab.classList.remove("show-tab", "active");
  });
  contentPanels.forEach((panel) => {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
  });

  const errorMsg = document.getElementById("error-msg");
  if (errorMsg) errorMsg.style.display = "none";

  if (selectValue === "estadistiques") {
    footer.style.display = "none";
    const statsPanel = document.getElementById("estadistiques-content");
    if (statsPanel) {
      statsPanel.classList.add("active");
      statsPanel.setAttribute("aria-hidden", "false");
      cambiarVistaEstadisticas("global");
      cargarEstadisticasLocales();
    }
    return;
  } else if (selectValue === "simulacre") {
    footer.style.display = "flex";
    const simulacrePanel = document.getElementById("simulacre-content");
    if (simulacrePanel) {
      simulacrePanel.classList.add("active");
      simulacrePanel.setAttribute("aria-hidden", "false");
    }
    return;
  } else {
    footer.style.display = "flex";
  }

  if (selectValue) {
    const selectedTabs = document.querySelectorAll(
      `.posit-tab[data-category="${selectValue}"]`,
    );
    selectedTabs.forEach((tab) => tab.classList.add("show-tab"));
    if (selectedTabs.length > 0) {
      showContent(selectedTabs[0].getAttribute("data-target"), selectedTabs[0]);
    }
  }
}

function showContent(targetId, element) {
  resetearSelecciones();
  const tabs = document.querySelectorAll(".posit-tab");
  const contentPanels = document.querySelectorAll(".content-panel");

  const errorMsg = document.getElementById("error-msg");
  if (errorMsg) errorMsg.style.display = "none";
  const dinamicaSelect = document.getElementById("tipo-dinamica");
  const optionPdf = dinamicaSelect.querySelector('option[value="PDF"]');
  if (optionPdf) {
    if (targetId === "examens") {
      optionPdf.style.display = "none";
      if (dinamicaSelect.value === "PDF") {
        dinamicaSelect.value = "XX";
        cambiarInterfazDinamica();
      }
    } else {
      optionPdf.style.display = "block";
    }
  }

  tabs.forEach((tab) => tab.classList.remove("active"));
  element.classList.add("active");

  contentPanels.forEach((panel) => {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
  });

  const targetPanel = document.getElementById(`${targetId}-content`);
  if (targetPanel) {
    targetPanel.classList.add("active");
    targetPanel.setAttribute("aria-hidden", "false");
  }
}

function seleccionarTots(checkbox, blocId) {
  const unitats = document.querySelectorAll(`#unitats-${blocId} .unitat-item`);
  unitats.forEach((u) => (u.checked = checkbox.checked));
  actualizarApartats(blocId);
}

function verificarTots(blocId) {
  const unitats = document.querySelectorAll(`#unitats-${blocId} .unitat-item`);
  const checkboxTots = document.getElementById(`check-tots-${blocId}`);
  if (checkboxTots)
    checkboxTots.checked = Array.from(unitats).every((u) => u.checked);
  actualizarApartats(blocId);
}

function actualizarVisibilidad(blocId) {
  const unitats = document.querySelectorAll(`#unitats-${blocId} .unitat-item`);
  const apartats = document.querySelectorAll(
    `#dynamic-apartats-${blocId} .apartat-item`,
  );
  const marcadesApartats = Array.from(apartats).filter((a) => a.checked);
  const checkTotsApartats = document.getElementById(
    `check-tots-apartats-${blocId}`,
  );
  const btnTotsApartats = checkTotsApartats
    ? checkTotsApartats.closest(".tots-checkbox")
    : null;

  const punts = document.querySelectorAll(
    `#dynamic-punts-${blocId} .punt-item`,
  );
  const marcadesPunts = Array.from(punts).filter((p) => p.checked);
  const checkTotsPunts = document.getElementById(`check-tots-punts-${blocId}`);
  const btnTotsPunts = checkTotsPunts
    ? checkTotsPunts.closest(".tots-checkbox")
    : null;

  const subpunts = document.querySelectorAll(
    `#dynamic-subpunts-${blocId} .subpunt-item`,
  );
  const marcadesSubpunts = Array.from(subpunts).filter((s) => s.checked);
  const checkTotsSubpunts = document.getElementById(
    `check-tots-subpunts-${blocId}`,
  );
  const btnTotsSubpunts = checkTotsSubpunts
    ? checkTotsSubpunts.closest(".tots-checkbox")
    : null;

  unitats.forEach((u) => (u.closest("label").style.display = "block"));
  if (btnTotsApartats) btnTotsApartats.style.display = "flex";
  apartats.forEach((a) => (a.closest("label").style.display = "block"));
  if (btnTotsPunts) btnTotsPunts.style.display = "flex";
  punts.forEach((p) => (p.closest("label").style.display = "block"));
  if (btnTotsSubpunts) btnTotsSubpunts.style.display = "flex";
  if (subpunts)
    subpunts.forEach((s) => (s.closest("label").style.display = "block"));

  if (checkTotsSubpunts && checkTotsSubpunts.checked) {
    const containerSub = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (containerSub) containerSub.style.display = "none";
    unitats.forEach((u) => {
      if (!u.checked) u.closest("label").style.display = "none";
    });
  } else if (marcadesSubpunts.length > 0) {
    unitats.forEach((u) => {
      if (!u.checked) u.closest("label").style.display = "none";
    });
    if (btnTotsApartats) btnTotsApartats.style.display = "none";
    apartats.forEach((a) => {
      if (!a.checked) a.closest("label").style.display = "none";
    });
    if (btnTotsPunts) btnTotsPunts.style.display = "none";
    punts.forEach((p) => {
      if (!p.checked) p.closest("label").style.display = "none";
    });
  } else if (checkTotsPunts && checkTotsPunts.checked) {
    const containerPunts = document.getElementById(`dynamic-punts-${blocId}`);
    if (containerPunts) containerPunts.style.display = "none";
    const containerSub = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (containerSub) containerSub.style.display = "none";
    unitats.forEach((u) => {
      if (!u.checked) u.closest("label").style.display = "none";
    });
  } else if (marcadesPunts.length > 0) {
    unitats.forEach((u) => {
      if (!u.checked) u.closest("label").style.display = "none";
    });
    if (btnTotsApartats) btnTotsApartats.style.display = "none";
    apartats.forEach((a) => {
      if (!a.checked) a.closest("label").style.display = "none";
    });
  } else if (checkTotsApartats && checkTotsApartats.checked) {
    const containerApartats = document.getElementById(
      `dynamic-apartats-${blocId}`,
    );
    if (containerApartats) containerApartats.style.display = "none";
    const containerPunts = document.getElementById(`dynamic-punts-${blocId}`);
    if (containerPunts) containerPunts.style.display = "none";
    const containerSub = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (containerSub) containerSub.style.display = "none";
  } else if (marcadesApartats.length > 0) {
    unitats.forEach((u) => {
      if (!u.checked) u.closest("label").style.display = "none";
    });
  }

  actualizarBadgesTargetes();
}

function actualizarApartats(blocId) {
  const unitats = document.querySelectorAll(`#unitats-${blocId} .unitat-item`);
  const marcades = Array.from(unitats).filter((u) => u.checked);

  if (marcades.length !== 1) {
    const oldApartats = document.getElementById(`dynamic-apartats-${blocId}`);
    if (oldApartats) oldApartats.remove();
    const oldPunts = document.getElementById(`dynamic-punts-${blocId}`);
    if (oldPunts) oldPunts.remove();
    const oldSub = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (oldSub) oldSub.remove();
  } else {
    const oldApartats = document.getElementById(`dynamic-apartats-${blocId}`);
    if (!oldApartats) {
      const idUnitat = marcades[0].value;
      const llistaNoms = dades[blocId].apartats[idUnitat];

      if (llistaNoms && llistaNoms.length > 0) {
        const container = document.createElement("div");
        container.id = `dynamic-apartats-${blocId}`;
        container.className = "sub-items-container";

        let html = `<div class="tots-checkbox"><input type="checkbox" id="check-tots-apartats-${blocId}"><label for="check-tots-apartats-${blocId}">TOTS ELS APARTATS</label></div>`;
        llistaNoms.forEach((nom, index) => {
          const idAp = `${idUnitat}.${index + 1}`;
          html += `<label><input type="checkbox" class="apartat-item" value="${idAp}"> ${nom} <span class="badge-targetes" id="badge-${idAp}"></span></label>`;
        });
        container.innerHTML = html;
        marcades[0]
          .closest("label")
          .insertAdjacentElement("afterend", container);
      }
    }
  }
  actualizarPunts(blocId);
}

function seleccionarTotsApartats(checkbox, blocId) {
  const apartats = document.querySelectorAll(
    `#dynamic-apartats-${blocId} .apartat-item`,
  );
  apartats.forEach((a) => (a.checked = checkbox.checked));
  actualizarPunts(blocId);
}

function canviApartat(blocId) {
  const apartats = document.querySelectorAll(
    `#dynamic-apartats-${blocId} .apartat-item`,
  );
  const checkboxTots = document.getElementById(`check-tots-apartats-${blocId}`);
  if (apartats.length > 0 && checkboxTots)
    checkboxTots.checked = Array.from(apartats).every((a) => a.checked);
  actualizarPunts(blocId);
}

function actualizarPunts(blocId) {
  const apartats = document.querySelectorAll(
    `#dynamic-apartats-${blocId} .apartat-item`,
  );
  const marcades = Array.from(apartats).filter((a) => a.checked);

  if (marcades.length !== 1) {
    const oldPunts = document.getElementById(`dynamic-punts-${blocId}`);
    if (oldPunts) oldPunts.remove();
    const oldSub = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (oldSub) oldSub.remove();
  } else {
    const oldPunts = document.getElementById(`dynamic-punts-${blocId}`);
    if (!oldPunts) {
      const idApartat = marcades[0].value;
      const llistaPunts = dades[blocId].punts[idApartat];

      if (llistaPunts && llistaPunts.length > 0) {
        const container = document.createElement("div");
        container.id = `dynamic-punts-${blocId}`;
        container.className = "sub-items-container punt-container-indent";

        let html = `<div class="tots-checkbox"><input type="checkbox" id="check-tots-punts-${blocId}"><label for="check-tots-punts-${blocId}">TOTS ELS PUNTS</label></div>`;
        llistaPunts.forEach((nom, index) => {
          const idPunt = `${idApartat}.${index + 1}`;
          html += `<label><input type="checkbox" class="punt-item" value="${idPunt}"> ${nom} <span class="badge-targetes" id="badge-${idPunt}"></span></label>`;
        });
        container.innerHTML = html;
        marcades[0]
          .closest("label")
          .insertAdjacentElement("afterend", container);
      }
    }
  }
  actualizarSubpunts(blocId);
}

function seleccionarTotsPunts(checkbox, blocId) {
  const punts = document.querySelectorAll(
    `#dynamic-punts-${blocId} .punt-item`,
  );
  punts.forEach((p) => (p.checked = checkbox.checked));
  actualizarSubpunts(blocId);
}

function canviPunt(blocId) {
  const punts = document.querySelectorAll(
    `#dynamic-punts-${blocId} .punt-item`,
  );
  const checkboxTots = document.getElementById(`check-tots-punts-${blocId}`);
  if (punts.length > 0 && checkboxTots)
    checkboxTots.checked = Array.from(punts).every((p) => p.checked);
  actualizarSubpunts(blocId);
}

function actualizarSubpunts(blocId) {
  const punts = document.querySelectorAll(
    `#dynamic-punts-${blocId} .punt-item`,
  );
  const marcades = Array.from(punts).filter((p) => p.checked);

  if (marcades.length !== 1) {
    const oldSubpunts = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (oldSubpunts) oldSubpunts.remove();
  } else {
    const oldSubpunts = document.getElementById(`dynamic-subpunts-${blocId}`);
    if (!oldSubpunts) {
      const idPunt = marcades[0].value;
      const llistaSubpunts = dades[blocId].subpunts
        ? dades[blocId].subpunts[idPunt]
        : null;

      if (llistaSubpunts && llistaSubpunts.length > 0) {
        const container = document.createElement("div");
        container.id = `dynamic-subpunts-${blocId}`;
        container.className = "sub-items-container punt-container-indent";

        let html = `<div class="tots-checkbox"><input type="checkbox" id="check-tots-subpunts-${blocId}"><label for="check-tots-subpunts-${blocId}">TOTS ELS SUBPUNTS</label></div>`;
        llistaSubpunts.forEach((nom, index) => {
          const idSubpunt = `${idPunt}.${index + 1}`;
          html += `<label><input type="checkbox" class="subpunt-item" value="${idSubpunt}"> ${nom} <span class="badge-targetes" id="badge-${idSubpunt}"></span></label>`;
        });
        container.innerHTML = html;
        marcades[0]
          .closest("label")
          .insertAdjacentElement("afterend", container);
      }
    }
  }
  actualizarVisibilidad(blocId);
}

function seleccionarTotsSubpunts(checkbox, blocId) {
  const subpunts = document.querySelectorAll(
    `#dynamic-subpunts-${blocId} .subpunt-item`,
  );
  subpunts.forEach((s) => (s.checked = checkbox.checked));
  actualizarVisibilidad(blocId);
}

function canviSubpunt(blocId) {
  const subpunts = document.querySelectorAll(
    `#dynamic-subpunts-${blocId} .subpunt-item`,
  );
  const checkboxTots = document.getElementById(`check-tots-subpunts-${blocId}`);
  if (subpunts.length > 0 && checkboxTots)
    checkboxTots.checked = Array.from(subpunts).every((s) => s.checked);
  actualizarVisibilidad(blocId);
}

function toggleBola(bola) {
  bola.classList.toggle("selected");
  const fila = bola.classList.contains("bola-a")
    ? "a"
    : bola.classList.contains("bola-b")
      ? "b"
      : "c";
  verificarTotsIdees(fila);
}

function seleccionarTotsIdees(checkbox, fila) {
  const bolas = document.querySelectorAll(`.bola-${fila}`);
  if (checkbox.checked) {
    bolas.forEach((b) => b.classList.add("selected"));
  } else {
    bolas.forEach((b) => b.classList.remove("selected"));
  }
}

function verificarTotsIdees(fila) {
  const bolas = document.querySelectorAll(`.bola-${fila}`);
  const checkbox = document.getElementById(`check-tots-idees-${fila}`);
  if (checkbox)
    checkbox.checked = Array.from(bolas).every((b) =>
      b.classList.contains("selected"),
    );
}

function toggleTotsAnys() {
  const btnTots = document.getElementById("btn-tots-anys");
  const anys = document.querySelectorAll(".any-item");
  if (btnTots.classList.contains("selected")) {
    btnTots.classList.remove("selected");
    anys.forEach((btn) => btn.classList.remove("selected"));
  } else {
    btnTots.classList.add("selected");
    anys.forEach((btn) => btn.classList.add("selected"));
  }
  actualizarModelsExamens();
}

function toggleAny(btn) {
  btn.classList.toggle("selected");
  verificarTotsAnys();
  actualizarModelsExamens();
}

function verificarTotsAnys() {
  const anys = document.querySelectorAll(".any-item");
  const btnTots = document.getElementById("btn-tots-anys");
  const todosSeleccionados = Array.from(anys).every((btn) =>
    btn.classList.contains("selected"),
  );
  if (todosSeleccionados) {
    btnTots.classList.add("selected");
  } else {
    btnTots.classList.remove("selected");
  }
}

function actualizarModelsExamens() {
  const anysSeleccionados = document.querySelectorAll(".any-item.selected");
  const containerModels = document.getElementById("models-container-examens");
  const containerBotones = document.getElementById("botones-models-dinamics");
  const dinamicaActual = document.getElementById("tipo-dinamica").value;

  if (anysSeleccionados.length === 1) {
    const spanText = anysSeleccionados[0].querySelector(".text-any");
    const textSeleccionat = spanText
      ? spanText.innerText.trim()
      : anysSeleccionados[0].innerText.trim();

    if (dinamicaActual === "TT") {
      containerModels.style.display = "none";
      containerModels
        .querySelectorAll(".btn-simple")
        .forEach((b) => b.classList.remove("selected"));
    } else if (
      textSeleccionat === "ACTUALITAT 2026" ||
      textSeleccionat === "46/17" ||
      textSeleccionat === "46/21" ||
      textSeleccionat === "46/19"
    ) {
      containerModels.style.display = "block";
      containerBotones.innerHTML =
        '<button class="btn-simple selected">Model 01</button>';
    } else {
      containerModels.style.display = "block";
      containerBotones.innerHTML =
        '<button class="btn-simple">Model 01</button><button class="btn-simple">Model 02</button>';
    }
  } else {
    containerModels.style.display = "none";
    containerModels
      .querySelectorAll(".btn-simple")
      .forEach((b) => b.classList.remove("selected"));
  }
}

function seleccionarSimulacreGlobal() {
  const btnGlobal = document.getElementById("btn-simulacre-global");
  const itemsSimulacre = document.querySelectorAll(".item-simulacre");
  btnGlobal.classList.toggle("selected");
  if (btnGlobal.classList.contains("selected")) {
    itemsSimulacre.forEach((i) => i.classList.add("selected"));
  } else {
    itemsSimulacre.forEach((i) => i.classList.remove("selected"));
  }
}

function filtrarPreguntas(baseDeDatos) {
  let preguntasFiltradas = [];
  const categoriaActiva = document.getElementById("category-select").value;

  if (categoriaActiva === "simulacre") {
    const btnGlobal = document
      .getElementById("btn-simulacre-global")
      .classList.contains("selected");

    if (btnGlobal) {
      preguntasFiltradas = [...baseDeDatos];
    } else {
      const blocA = document
        .querySelector(".simulacre-bloc-a")
        .classList.contains("selected");
      const blocB = document
        .querySelector(".simulacre-bloc-b")
        .classList.contains("selected");
      const blocC = document
        .querySelector(".simulacre-bloc-c")
        .classList.contains("selected");
      const examens = document
        .querySelector(".simulacre-examens")
        .classList.contains("selected");

      preguntasFiltradas = baseDeDatos.filter((p) => {
        if (
          blocA &&
          p.bloc === "a" &&
          (p.tipo === "temari" || p.tipo === "idees")
        )
          return true;
        if (
          blocB &&
          p.bloc === "b" &&
          (p.tipo === "temari" || p.tipo === "idees")
        )
          return true;
        if (
          blocC &&
          p.bloc === "c" &&
          (p.tipo === "temari" || p.tipo === "idees")
        )
          return true;
        if (examens && p.tipo === "examens") return true;
        return false;
      });
    }
  } else if (categoriaActiva === "temari") {
    const tabActiva =
      document.querySelector(".posit-tab.active").dataset.target;

    if (tabActiva === "examens") {
      const añosSeleccionados = Array.from(
        document.querySelectorAll(".any-item.selected"),
      ).map((el) => {
        const spanText = el.querySelector(".text-any");
        return spanText ? spanText.innerText.trim() : el.innerText.trim();
      });
      const ModelsSeleccionados = Array.from(
        document.querySelectorAll(
          "#models-container-examens .btn-simple.selected",
        ),
      ).map((el) => el.textContent.trim());

      preguntasFiltradas = baseDeDatos.filter(
        (p) =>
          p.tipo === "examens" &&
          añosSeleccionados.includes(p.any) &&
          (ModelsSeleccionados.length === 0 ||
            ModelsSeleccionados.includes(p.model)),
      );
    } else if (tabActiva === "idees") {
      const ideesSeleccionadas = Array.from(
        document.querySelectorAll(".btn-redonda.selected"),
      ).map((el) => el.childNodes[0].nodeValue.trim());
      preguntasFiltradas = baseDeDatos.filter(
        (p) => p.tipo === "idees" && ideesSeleccionadas.includes(p.idea),
      );
    } else {
      const subpunts = Array.from(
        document.querySelectorAll(".subpunt-item:checked"),
      ).map((el) => el.value);
      const punts = Array.from(
        document.querySelectorAll(".punt-item:checked"),
      ).map((el) => el.value);
      const apartats = Array.from(
        document.querySelectorAll(".apartat-item:checked"),
      ).map((el) => el.value);
      const unitats = Array.from(
        document.querySelectorAll(".unitat-item:checked"),
      ).map((el) => el.value);

      preguntasFiltradas = baseDeDatos.filter((p) => {
        if (p.tipo !== "temari") return false;
        if (subpunts.length > 0) return subpunts.includes(p.subpunt);
        if (punts.length > 0) return punts.includes(p.punt);
        if (apartats.length > 0) return apartats.includes(p.apartat);
        if (unitats.length > 0) return unitats.includes(p.unitat);
        return false;
      });
    }
  }

  return mezclarArray(preguntasFiltradas);
}

function mezclarArray(array) {
  let arrayCopia = [...array];
  for (let i = arrayCopia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopia[i], arrayCopia[j]] = [arrayCopia[j], arrayCopia[i]];
  }
  return arrayCopia;
}

function actualizarEstadisticasTotales() {
  let conteoUnidades = {};
  let conteoIdees = {};
  let conteoExamens = {};

  let totalBlocA = 0;
  let totalBlocB = 0;
  let totalBlocC = 0;
  let totalIdees = 0;
  let totalExamens = 0;

  baseDeDatosPreguntas.forEach((p) => {
    if (p.tipo === "temari") {
      if (p.bloc === "a") totalBlocA++;
      if (p.bloc === "b") totalBlocB++;
      if (p.bloc === "c") totalBlocC++;

      if (p.unitat) {
        const uKey = p.unitat.toLowerCase();
        conteoUnidades[uKey] = (conteoUnidades[uKey] || 0) + 1;
      }
    } else if (p.tipo === "idees") {
      totalIdees++;
      if (p.idea) {
        conteoIdees[p.idea.toUpperCase()] =
          (conteoIdees[p.idea.toUpperCase()] || 0) + 1;
      }
    } else if (p.tipo === "examens") {
      totalExamens++;
      if (p.any && p.model) {
        const keyEx = `${p.any}-${p.model}`.toLowerCase();
        conteoExamens[keyEx] = (conteoExamens[keyEx] || 0) + 1;
      }
    }
  });

  let statsData = JSON.parse(localStorage.getItem("estadisticasMossos")) || {};
  let esp = statsData.especific || {};

  ["a", "b", "c"].forEach((blocId) => {
    const contenedorBloc = document.getElementById(`especific-bloc-${blocId}`);
    if (!contenedorBloc) return;

    contenedorBloc
      .querySelectorAll(".especific-list-row")
      .forEach((fila, index) => {
        const numUnidad = index + 1;
        const codigoUnidad = `${blocId}${numUnidad}`;
        const cantidadReal = conteoUnidades[codigoUnidad] || 0;

        const dataEsp = esp[codigoUnidad] || {
          realitzades: 0,
          aciertos: 0,
          pregUniques: [],
        };
        const unicas = dataEsp.pregUniques ? dataEsp.pregUniques.length : 0;
        const pctAciertos =
          dataEsp.realitzades > 0
            ? Math.round((dataEsp.aciertos / dataEsp.realitzades) * 100)
            : 0;

        fila.setAttribute("data-totals", cantidadReal);
        fila.setAttribute("data-realitzades", unicas);
        fila.setAttribute("data-aciertos", pctAciertos);

        const spans = fila.querySelectorAll("span");
        if (spans.length > 1) {
          spans[1].innerText = `Totals: ${cantidadReal} | Realitzades: ${unicas} | Aciertos: ${pctAciertos}%`;
        }
      });
  });

  const contenedorIdees = document.getElementById("especific-idees");
  if (contenedorIdees) {
    contenedorIdees.querySelectorAll(".especific-sub-row").forEach((fila) => {
      const spanTexto = fila.querySelector("span");
      if (!spanTexto) return;

      const codigoIdea = spanTexto.innerText.trim().toUpperCase();
      const cantidadReal = conteoIdees[codigoIdea] || 0;

      const keyIdea = "idea-" + codigoIdea.toLowerCase();
      const dataEsp = esp[keyIdea] || {
        realitzades: 0,
        aciertos: 0,
        pregUniques: [],
      };
      const unicas = dataEsp.pregUniques ? dataEsp.pregUniques.length : 0;
      const pctAciertos =
        dataEsp.realitzades > 0
          ? Math.round((dataEsp.aciertos / dataEsp.realitzades) * 100)
          : 0;

      fila.setAttribute("data-totals", cantidadReal);
      fila.setAttribute("data-realitzades", unicas);
      fila.setAttribute("data-aciertos", pctAciertos);

      const spans = fila.querySelectorAll("span");
      if (spans.length > 1) {
        spans[1].innerText = `Totals: ${cantidadReal} | Realitzades: ${unicas} | Aciertos: ${pctAciertos}%`;
      }
    });
  }

  const contenedorExamens = document.getElementById("especific-examens");
  if (contenedorExamens) {
    let anyActual = "";

    Array.from(contenedorExamens.children).forEach((child) => {
      if (child.classList.contains("especific-group-title")) {
        anyActual = child.innerText.trim();
      } else if (child.classList.contains("especific-sub-row")) {
        const spanTexto = child.querySelector("span");
        if (!spanTexto || !anyActual) return;

        let nombreModelJson = "";
        if (anyActual.includes("ACTUALITAT")) {
          nombreModelJson = spanTexto.innerText.trim();
        } else {
          const numModel = spanTexto.innerText.trim().replace(/\D/g, "");
          nombreModelJson = `Model 0${numModel}`.replace("00", "0");
        }

        const keyBd = `${anyActual}-${nombreModelJson}`.toLowerCase();
        const cantidadReal = conteoExamens[keyBd] || 0;

        const keyEx = `ex-${anyActual}-${nombreModelJson}`.toLowerCase();
        const dataEsp = esp[keyEx] || {
          realitzades: 0,
          aciertos: 0,
          pregUniques: [],
        };
        const unicas = dataEsp.pregUniques ? dataEsp.pregUniques.length : 0;
        const pctAciertos =
          dataEsp.realitzades > 0
            ? Math.round((dataEsp.aciertos / dataEsp.realitzades) * 100)
            : 0;

        child.setAttribute("data-totals", cantidadReal);
        child.setAttribute("data-realitzades", unicas);
        child.setAttribute("data-aciertos", pctAciertos);

        const spans = child.querySelectorAll("span");
        if (spans.length > 1) {
          spans[1].innerText = `Totals: ${cantidadReal} | Realitzades: ${unicas} | Aciertos: ${pctAciertos}%`;
        }
      }
    });
  }

  ["a", "b", "c", "idees", "examens"].forEach((cat) => {
    let domId = cat;
    if (cat === "a" || cat === "b" || cat === "c") domId = `bloc-${cat}`;

    const header = document.querySelector(
      `#especific-${domId} .especific-bloc-header`,
    );
    if (!header) return;

    const det =
      statsData && statsData.detall && statsData.detall[cat]
        ? statsData.detall[cat]
        : {};
    const unicasCat = det.pregUniques ? det.pregUniques.length : 0;

    let totalCat = 0;
    if (cat === "a") totalCat = totalBlocA;
    else if (cat === "b") totalCat = totalBlocB;
    else if (cat === "c") totalCat = totalBlocC;
    else if (cat === "idees") totalCat = totalIdees;
    else if (cat === "examens") totalCat = totalExamens;

    let cobertura = totalCat > 0 ? Math.round((unicasCat / totalCat) * 100) : 0;

    let aciertosCat = 0;
    let realitzadesCat = 0;
    Object.keys(esp).forEach((k) => {
      if (
        (cat === "a" || cat === "b" || cat === "c") &&
        k.startsWith(cat) &&
        !k.startsWith("idea") &&
        !k.startsWith("ex-")
      ) {
        aciertosCat += esp[k].aciertos;
        realitzadesCat += esp[k].realitzades;
      } else if (cat === "idees" && k.startsWith("idea-")) {
        aciertosCat += esp[k].aciertos;
        realitzadesCat += esp[k].realitzades;
      } else if (cat === "examens" && k.startsWith("ex-")) {
        aciertosCat += esp[k].aciertos;
        realitzadesCat += esp[k].realitzades;
      }
    });

    let aciertosMitjans =
      realitzadesCat > 0 ? Math.round((aciertosCat / realitzadesCat) * 100) : 0;

    const innerChart = header.querySelector(".bloc-header-chart-inner");
    const wrapperChart = header.querySelector(".bloc-header-chart");
    const titleSpan = header.querySelector(".bloc-header-title");
    const detailsSpan = header.querySelector(".bloc-header-details");

    let estadoText = "🔴 En Risc (Zona Crítica)";
    let color = "#e74c3c";

    if (cobertura >= 70 && aciertosMitjans >= 85) {
      estadoText = "🟢 Òptim (Preparat)";
      color = "#2ecc71";
    } else if (cobertura > 0) {
      estadoText = "🟡 En Progrés (Millorable)";
      color = "#f39c12";
    }

    if (innerChart) innerChart.innerText = `${aciertosMitjans}%`;
    if (wrapperChart)
      wrapperChart.style.background = `conic-gradient(${color} ${aciertosMitjans * 3.6}deg, #e0e0e0 0deg)`;

    let titleName = cat.toUpperCase();
    if (cat === "a" || cat === "b" || cat === "c")
      titleName = `BLOC ${cat.toUpperCase()}`;
    else if (cat === "idees") titleName = "IDEES FORÇA";
    else if (cat === "examens") titleName = "EXÀMENS ANTERIORS";

    if (titleSpan) titleSpan.innerText = `Estat ${titleName}: ${estadoText}`;
    if (detailsSpan)
      detailsSpan.innerText = `Cobertura: ${cobertura}% | Aciertos Mitjans: ${aciertosMitjans}%`;
  });

  const itemsGlobal = document.querySelectorAll(
    "#view-resum-global .stat-list-item span:nth-child(2)",
  );
  if (itemsGlobal.length >= 10) {
    let det =
      statsData && statsData.detall
        ? statsData.detall
        : {
            a: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
            b: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
            c: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
            idees: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
            examens: { testsFets: 0, testsAprovats: 0, pregUniques: [] },
          };

    let getUniques = (cat) =>
      det[cat] && det[cat].pregUniques ? det[cat].pregUniques.length : 0;

    const formatColor = (num, total) => {
      let pct = total > 0 ? (num / total) * 100 : 0;
      let color = pct >= 75 ? "#03543f" : pct >= 50 ? "#FF8000" : "#9b1c1c";
      return `<span style="color: ${color}; font-weight: 900; font-size: 15px;">${num}</span> / ${total}`;
    };

    itemsGlobal[0].innerHTML = formatColor(
      det.a.testsAprovats,
      det.a.testsFets,
    );
    itemsGlobal[1].innerHTML = formatColor(
      det.b.testsAprovats,
      det.b.testsFets,
    );
    itemsGlobal[2].innerHTML = formatColor(
      det.c.testsAprovats,
      det.c.testsFets,
    );
    itemsGlobal[3].innerHTML = formatColor(
      det.idees.testsAprovats,
      det.idees.testsFets,
    );
    itemsGlobal[4].innerHTML = formatColor(
      det.examens.testsAprovats,
      det.examens.testsFets,
    );

    itemsGlobal[5].innerHTML = formatColor(getUniques("a"), totalBlocA);
    itemsGlobal[6].innerHTML = formatColor(getUniques("b"), totalBlocB);
    itemsGlobal[7].innerHTML = formatColor(getUniques("c"), totalBlocC);
    itemsGlobal[8].innerHTML = formatColor(getUniques("idees"), totalIdees);
    itemsGlobal[9].innerHTML = formatColor(getUniques("examens"), totalExamens);
  }

  if (typeof actualizarEstilosEstadisticas === "function") {
    actualizarEstilosEstadisticas();
  }
}

function obtenerMemoriaTarjetas() {
  let memoria = JSON.parse(localStorage.getItem("memoriaTarjetasMossos"));
  if (!memoria) {
    memoria = {};
  }

  let hayCambios = false;
  baseDeDatosPreguntas.forEach((p) => {
    let idSeguro = p.pregunta.trim();
    if (!memoria[idSeguro]) {
      memoria[idSeguro] = {
        estado: "nova",
        historial: [],
        fallosAcumulados: 0,
      };
      hayCambios = true;
    }
  });

  if (hayCambios) {
    guardarMemoriaTarjetas(memoria);
  }
  return memoria;
}

function guardarMemoriaTarjetas(memoria) {
  localStorage.setItem("memoriaTarjetasMossos", JSON.stringify(memoria));
}

document.addEventListener("DOMContentLoaded", () => {
  obtenerMemoriaTarjetas();
  actualizarBotonErrores();
});

function cambiarInterfazDinamica() {
  const selectElement = document.getElementById("tipo-dinamica");
  selectElement.style.backgroundColor =
    selectElement.value === "BB"
      ? "#2F62D0"
      : selectElement.value === "TT"
        ? "#d09400"
        : selectElement.value === "PDF"
          ? "#FF8000"
          : "#cc0000";
  const dinamica = selectElement.value;

  const colNumPreg = document.getElementById("col-num-preguntas");
  const colTjModo = document.getElementById("col-tarjetas-modo");
  const colTjOrden = document.getElementById("col-tarjetas-orden");
  const badges = document.querySelectorAll(".badge-targetes");
  const styleHide = document.getElementById("hide-subniveles");
  if (styleHide) styleHide.remove();
  const examensPanel = document.getElementById("examens-content");
  const ideesPanel = document.getElementById("idees-content");

  if (dinamica === "TT") {
    colNumPreg.style.display = "none";
    colTjModo.style.display = "flex";
    colTjOrden.style.display = "flex";
    badges.forEach((b) => (b.style.display = "inline-block"));
    if (examensPanel) examensPanel.classList.add("modo-tarjetas-activo");
    if (ideesPanel) ideesPanel.classList.add("modo-tarjetas-activo");
  } else if (dinamica === "PDF") {
    colNumPreg.style.display = "none";
    colTjModo.style.display = "none";
    colTjOrden.style.display = "none";
    badges.forEach((b) => (b.style.display = "none"));
    document.head.insertAdjacentHTML(
      "beforeend",
      '<style id="hide-subniveles">.sub-items-container { display: none !important; }</style>',
    );
    if (examensPanel) examensPanel.classList.remove("modo-tarjetas-activo");
    if (ideesPanel) ideesPanel.classList.remove("modo-tarjetas-activo");
  } else {
    colNumPreg.style.display = "flex";
    colTjModo.style.display = "none";
    colTjOrden.style.display = "none";
    badges.forEach((b) => (b.style.display = "none"));
    if (examensPanel) examensPanel.classList.remove("modo-tarjetas-activo");
    if (ideesPanel) ideesPanel.classList.remove("modo-tarjetas-activo");
  }
  actualizarBadgesTargetes();
  actualizarModelsExamens();
  actualizarBotonErrores();
}

function actualizarBadgesTargetes() {
  const memoria = obtenerMemoriaTarjetas();
  let contadores = {};
  const dinamica = document.getElementById("tipo-dinamica").value;

  baseDeDatosPreguntas.forEach((p) => {
    let idSeguro = p.pregunta.trim();
    let estado = memoria[idSeguro] ? memoria[idSeguro].estado : "nova";
    let esSabuda = estado === "sabuda" ? 1 : 0;

    const sumarA = (id) => {
      if (!id) return;
      if (!contadores[id]) contadores[id] = { total: 0, sabudes: 0 };
      contadores[id].total++;
      contadores[id].sabudes += esSabuda;
    };

    sumarA(p.unitat);
    sumarA(p.apartat);
    sumarA(p.punt);
    sumarA(p.subpunt);
    sumarA(p.any);
    if (p.idea) {
      sumarA("idea-" + p.idea.toLowerCase());
    }
  });

  document.querySelectorAll(".badge-targetes").forEach((badge) => {
    let idElemento = badge.id.replace("badge-", "");

    if (dinamica === "TT") {
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }

    if (contadores[idElemento]) {
      badge.innerText = `[${contadores[idElemento].sabudes}/${contadores[idElemento].total}]`;

      if (
        contadores[idElemento].sabudes === contadores[idElemento].total &&
        contadores[idElemento].total > 0
      ) {
        badge.style.backgroundColor = "#03543f";
        badge.style.borderColor = "#84e1bc";
      } else {
        badge.style.backgroundColor = "#26404F";
        badge.style.borderColor = "#7ba5bf";
      }
    } else {
      badge.innerText = `[0/0]`;
      badge.style.backgroundColor = "#26404F";
      badge.style.borderColor = "#7ba5bf";
    }
  });
}

function exportarDades() {
  const dades = {
    estadisticasMossos: JSON.parse(
      localStorage.getItem("estadisticasMossos") || "{}",
    ),
    memoriaTarjetasMossos: JSON.parse(
      localStorage.getItem("memoriaTarjetasMossos") || "{}",
    ),
  };

  const jsonString = JSON.stringify(dades);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const btn = document.getElementById("btn-descarregar");
  const dataActual = new Date().toISOString().split("T")[0];

  btn.href = url;
  btn.download = `progres_mossos_${dataActual}.json`;
}

function guardarErrorUnico(preguntaObj) {
  let errores = JSON.parse(localStorage.getItem("erroresMossos")) || [];
  if (!errores.some((e) => e.pregunta === preguntaObj.pregunta)) {
    errores.push(preguntaObj);
    localStorage.setItem("erroresMossos", JSON.stringify(errores));
  }

  if (errores.length >= 30) {
    localStorage.setItem("bloqueoErroresMossos", "true");
  }

  actualizarBotonErrores();
}

function actualizarBotonErrores() {
  let errores = JSON.parse(localStorage.getItem("erroresMossos")) || [];
  const contenedor = document.getElementById("contenedor-errores-footer");
  const badge = document.getElementById("num-errores-badge");
  const dinamica = document.getElementById("tipo-dinamica").value;

  if (!contenedor || !badge) return;

  if (errores.length > 0 && (dinamica === "XX" || dinamica === "BB")) {
    contenedor.style.display = "flex";
    badge.innerText = errores.length;
  } else {
    contenedor.style.display = "none";
  }
}

function iniciarRepasoErrores() {
  let errores = JSON.parse(localStorage.getItem("erroresMossos")) || [];
  if (errores.length === 0) return;

  testActualState.preguntas = [...errores];
  testActualState.respuestasUsuario = {};
  testActualState.estadosPreguntas = new Array(
    testActualState.preguntas.length,
  ).fill("gris");
  testActualState.indiceActual = 0;
  testActualState.modo = "repaso_errores";

  testActualState.preguntas.forEach((p) => {
    let opcionesConIndice = p.opciones.map((op, idx) => ({
      texto: op,
      esCorrecta: idx === 0,
    }));
    p.opcionesAleatorias = mezclarArray(opcionesConIndice);
  });

  document.getElementById("footer-actions").style.display = "none";
  document.querySelector(".toolbar").style.display = "none";
  const titolPrincipal = document.querySelector(".titol-principal");
  if (titolPrincipal) titolPrincipal.style.display = "none";

  document.querySelectorAll(".content-panel").forEach((p) => {
    p.classList.remove("active");
    p.setAttribute("aria-hidden", "true");
  });

  const panelTest = document.getElementById("test-content");
  panelTest.classList.add("active");
  panelTest.setAttribute("aria-hidden", "false");

  document.getElementById("test-mode-label").innerText = "REPAS D'ERRORS";
  document.getElementById("test-cronometro").style.display = "none";
  document.getElementById("classic-test-ui").style.display = "block";
  document.getElementById("flashcard-ui").style.display = "none";
  document.querySelector("#classic-test-ui .seccion-interna").style.display =
    "flex";
  document.getElementById("mapa-preguntas").style.display = "flex";

  const repasoEnd = document.getElementById("repaso-end-screen");
  if (repasoEnd) repasoEnd.style.display = "none";

  construirMapaPreguntas();
  cargarPreguntaEnPantalla(0);
}

function importarDades(event) {
  const file = event.target.files[0];
  if (!file) return;

  const msgElement = document.getElementById("sync-msg");
  if (msgElement) msgElement.style.display = "none";

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dades = JSON.parse(e.target.result);

      if (dades.estadisticasMossos || dades.memoriaTarjetasMossos) {
        if (dades.estadisticasMossos) {
          localStorage.setItem(
            "estadisticasMossos",
            JSON.stringify(dades.estadisticasMossos),
          );
        }
        if (dades.memoriaTarjetasMossos) {
          localStorage.setItem(
            "memoriaTarjetasMossos",
            JSON.stringify(dades.memoriaTarjetasMossos),
          );
        }

        if (msgElement) {
          msgElement.style.backgroundColor = "#def7ec";
          msgElement.style.color = "#03543f";
          msgElement.style.border = "2px solid #84e1bc";
          msgElement.innerText =
            "✅ Progrés carregat correctament! Actualitzant la pàgina...";
          msgElement.style.display = "block";
        }
        setTimeout(() => location.reload(), 1500);
      } else {
        if (msgElement) {
          msgElement.style.backgroundColor = "#fde8e8";
          msgElement.style.color = "#9b1c1c";
          msgElement.style.border = "2px solid #f8b4b4";
          msgElement.innerText =
            "❌ Error: El fitxer no conté dades vàlides per a l'aplicació.";
          msgElement.style.display = "block";
        }
      }
    } catch (error) {
      if (msgElement) {
        msgElement.style.backgroundColor = "#fde8e8";
        msgElement.style.color = "#9b1c1c";
        msgElement.style.border = "2px solid #f8b4b4";
        msgElement.innerText =
          "❌ Error en llegir el fitxer. Assegura't que és el fitxer .json correcte.";
        msgElement.style.display = "block";
      }
    }

    event.target.value = "";
  };
  reader.readAsText(file);
}

let fcState = {
  cola: [],
  totales: 0,
  sabudes: 0,
  pendientes: 0,
  tarjetaActual: null,
  revelada: false,
  eventosIniciados: false,
};

function iniciarDinamicaTarjetas(preguntasFiltradas) {
  let memoria = obtenerMemoriaTarjetas();

  const modoSelec = document.getElementById("modo-tarjetas").value;

  let seleccion = preguntasFiltradas.filter((p) => {
    let mem = memoria[p.pregunta.trim()];
    if (!mem) return false;

    if (modoSelec === "noves") return mem.estado === "nova";
    if (modoSelec === "repasar")
      return mem.estado === "repaso" || mem.fallosAcumulados > 0;
    if (modoSelec === "sabudes") return mem.estado === "sabuda";
    return true;
  });

  let errorMsg = document.getElementById("error-msg");
  const estilBase =
    "color: #ff4d4d; font-weight: bold; display: block; margin-bottom: 15px; margin-top: 15px; text-transform: uppercase; text-align: center;";

  let criticas = seleccion.filter(
    (p) => memoria[p.pregunta.trim()].fallosAcumulados >= 3,
  );

  if (criticas.length > 5 && modoSelec === "noves") {
    errorMsg.style.cssText = estilBase;
    errorMsg.innerText =
      "⚠️ MODO QUARANTENA: Tens més de 5 targetes encallades (3+ errors). Selecciona el mode 'A Repassar' per desbloquejar-les abans d'aprendre'n de noves.";
    errorMsg.style.display = "block";
    errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (seleccion.length === 0) {
    errorMsg.style.cssText = estilBase;
    errorMsg.innerText =
      "No hi ha targetes pendents per a aquesta selecció i mode.";
    errorMsg.style.display = "block";
    errorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  errorMsg.style.display = "none";

  fcState.cola = [...seleccion];

  const ordenSelec = document.getElementById("orden-tarjetas").value;
  if (ordenSelec === "aleatorio") {
    fcState.cola = mezclarArray(fcState.cola);
  }

  fcState.totales = fcState.cola.length;

  fcState.sabudes = 0;
  fcState.cola.forEach((p) => {
    let mem = memoria[p.pregunta.trim()];
    if (mem && mem.estado === "sabuda") {
      fcState.sabudes++;
    }
  });

  fcState.pendientes = fcState.totales - fcState.sabudes;

  document.getElementById("footer-actions").style.display = "none";
  document.querySelector(".toolbar").style.display = "none";
  document.querySelector(".titol-principal").style.display = "none";
  document.querySelectorAll(".content-panel").forEach((p) => {
    p.classList.remove("active");
    p.setAttribute("aria-hidden", "true");
  });

  const panelTest = document.getElementById("test-content");
  panelTest.classList.add("active");
  panelTest.setAttribute("aria-hidden", "false");

  document.getElementById("classic-test-ui").style.display = "none";
  document.getElementById("flashcard-ui").style.display = "block";
  document.getElementById("fc-end-screen").classList.remove("active");
  document.getElementById("test-mode-label").innerText = "TARGETES";

  inicializarEventosTargetes();
  cargarSiguienteTarjeta();
}

function cargarSiguienteTarjeta() {
  actualizarDashboardFC();

  const card = document.getElementById("fc-card");

  if (fcState.cola.length === 0) {
    document.getElementById("fc-end-screen").classList.add("active");
    card.style.display = "none";
    document.getElementById("test-info-bloque").innerText =
      "Repàs Espaiat (SRS) - Maç Finalitzat";
    return;
  }

  card.style.display = "flex";
  fcState.tarjetaActual = fcState.cola.shift();
  fcState.revelada = false;

  let p = fcState.tarjetaActual;
  let rutaInfo = "";
  if (p.tipo === "temari") {
    rutaInfo = `Bloc ${p.bloc.toUpperCase()}`;
    if (p.unitat) rutaInfo += ` • Unitat ${p.unitat.toUpperCase()}`;
    if (p.apartat) rutaInfo += ` • Apartat ${p.apartat.toUpperCase()}`;
    if (p.punt) rutaInfo += ` • Punt ${p.punt.toUpperCase()}`;
    if (p.subpunt) rutaInfo += ` • Subpunt ${p.subpunt.toUpperCase()}`;
  } else if (p.tipo === "idees") {
    rutaInfo = `Idees Força • Bloc ${p.bloc.toUpperCase()} • ${p.idea.toUpperCase()}`;
  } else if (p.tipo === "examens") {
    rutaInfo = `Exàmens Anteriors • Any ${p.any} • ${p.model}`;
  }
  document.getElementById("test-info-bloque").innerText = rutaInfo;

  let memoria = obtenerMemoriaTarjetas();
  let mem = memoria[fcState.tarjetaActual.pregunta.trim()];

  const tag = document.getElementById("fc-tag");
  if (mem.estado === "nova") {
    tag.innerText = "NOVA";
    tag.className = "flashcard-tag tag-nova";
  } else if (mem.estado === "sabuda") {
    tag.innerText = "SABUDA";
    tag.className = "flashcard-tag tag-sabuda";
  } else {
    tag.innerText = "REPETIDA";
    tag.className = "flashcard-tag tag-repaso";
  }

  document.getElementById("fc-counter").innerText =
    `${fcState.totales - fcState.pendientes + 1} / ${fcState.totales}`;
  document.getElementById("fc-pregunta").innerText =
    fcState.tarjetaActual.pregunta;

  document.getElementById("fc-respuesta").innerText =
    fcState.tarjetaActual.opciones[0];

  card.classList.remove("revelada");
  document.getElementById("btn-fc-mostrar").classList.remove("oculto");
  document.getElementById("btn-fc-repetir").disabled = true;
  document.getElementById("btn-fc-correcta").disabled = true;

  card.style.transition = "none";
  card.style.transform = "translate(0px, 0px) rotate(0deg)";
  card.style.borderColor = "#000000";
  card.style.backgroundColor = "#ffffff";

  setTimeout(() => {
    card.style.transition =
      "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease";
  }, 50);
}

function revelarTarjeta() {
  if (fcState.revelada) return;
  fcState.revelada = true;
  document.getElementById("fc-card").classList.add("revelada");
  document.getElementById("btn-fc-mostrar").classList.add("oculto");
  document.getElementById("btn-fc-repetir").disabled = false;
  document.getElementById("btn-fc-correcta").disabled = false;
}

function procesarTarjetaFC(esCorrecta) {
  if (!fcState.revelada) return;

  let memoria = obtenerMemoriaTarjetas();
  let idSeguro = fcState.tarjetaActual.pregunta.trim();
  let mem = memoria[idSeguro];
  let estadoPrevio = mem.estado;

  if (esCorrecta) {
    mem.historial.push(1);
    if (mem.historial.length > 3) mem.historial.shift();

    if (mem.historial.join(",") === "1,1,1") {
      mem.estado = "sabuda";

      if (estadoPrevio !== "sabuda") {
        fcState.sabudes++;
        fcState.pendientes--;
      }
    } else {
      let saltos = estadoPrevio === "nova" ? 10 : 5;
      reinsertarTarjeta(fcState.tarjetaActual, saltos);
    }
  } else {
    mem.historial.push(0);
    if (mem.historial.length > 3) mem.historial.shift();
    mem.fallosAcumulados++;
    mem.estado = "repaso";

    if (estadoPrevio === "sabuda") {
      fcState.sabudes--;
      fcState.pendientes++;
    }

    if (mem.fallosAcumulados === 1) reinsertarTarjeta(fcState.tarjetaActual, 5);
    else if (mem.fallosAcumulados === 2)
      reinsertarTarjeta(fcState.tarjetaActual, 3);
    else reinsertarTarjeta(fcState.tarjetaActual, 1);
  }

  guardarMemoriaTarjetas(memoria);
  actualizarBadgesTargetes();
  cargarSiguienteTarjeta();
}

function reinsertarTarjeta(tarjeta, saltos) {
  let pos = Math.min(saltos, fcState.cola.length);
  fcState.cola.splice(pos, 0, tarjeta);
}

function actualizarDashboardFC() {
  document.getElementById("fc-stat-totales").innerText = fcState.totales;
  document.getElementById("fc-stat-sabudes").innerText = fcState.sabudes;
  document.getElementById("fc-stat-pendents").innerText = fcState.pendientes;
}

function inicializarEventosTargetes() {
  if (fcState.eventosIniciados) return;
  fcState.eventosIniciados = true;

  const card = document.getElementById("fc-card");
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  const threshold = 100;

  const onStart = (e) => {
    if (
      !fcState.revelada ||
      (fcState.cola.length === 0 && !fcState.tarjetaActual)
    )
      return;
    isDragging = true;
    startX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
    card.classList.add("dragging");
  };

  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
    currentX = x - startX;
    const rotate = currentX * 0.05;

    card.style.transform = `translate(${currentX}px, 0px) rotate(${rotate}deg)`;

    if (currentX > 0) {
      let intensity = Math.min(currentX / threshold, 1);
      card.style.borderColor = `rgba(3, 84, 63, ${intensity})`;

      card.style.backgroundColor = `rgb(${255 - 33 * intensity}, ${255 - 8 * intensity}, ${255 - 19 * intensity})`;
    } else {
      let intensity = Math.min(Math.abs(currentX) / threshold, 1);
      card.style.borderColor = `rgba(155, 28, 28, ${intensity})`;

      card.style.backgroundColor = `rgb(${255 - 2 * intensity}, ${255 - 23 * intensity}, ${255 - 23 * intensity})`;
    }
  };

  const onEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    card.classList.remove("dragging");

    if (currentX > threshold) {
      card.style.transform = `translate(1000px, 0px) rotate(30deg)`;
      setTimeout(() => procesarTarjetaFC(true), 200);
    } else if (currentX < -threshold) {
      card.style.transform = `translate(-1000px, 0px) rotate(-30deg)`;
      setTimeout(() => procesarTarjetaFC(false), 200);
    } else {
      card.style.transform = "translate(0px, 0px) rotate(0deg)";
      card.style.borderColor = "#000000";
      card.style.backgroundColor = "#ffffff";
    }
    currentX = 0;
  };

  card.addEventListener("mousedown", onStart);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);

  card.addEventListener("touchstart", onStart, { passive: false });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);

  card.addEventListener("click", () => {
    if (Math.abs(currentX) < 5) revelarTarjeta();
  });

  document.getElementById("btn-fc-mostrar").addEventListener("click", (e) => {
    e.stopPropagation();
    revelarTarjeta();
  });

  document.getElementById("btn-fc-correcta").addEventListener("click", () => {
    card.style.transform = `translate(1000px, 0px) rotate(30deg)`;
    setTimeout(() => procesarTarjetaFC(true), 200);
  });

  document.getElementById("btn-fc-repetir").addEventListener("click", () => {
    card.style.transform = `translate(-1000px, 0px) rotate(-30deg)`;
    setTimeout(() => procesarTarjetaFC(false), 200);
  });
}

function carregarPdfActual() {
  const pdfData = window.llistaPdfs[window.indexPdfActual];
  document.getElementById("iframe-pdf").src = pdfData.ruta;
  document.getElementById("pdf-titol").innerText = pdfData.titol;

  const navButtons = document.getElementById("pdf-nav-buttons");
  const btnAnt = document.getElementById("btn-pdf-ant");
  const btnSeg = document.getElementById("btn-pdf-seg");

  if (window.llistaPdfs.length > 1) {
    navButtons.style.display = "flex";

    btnAnt.style.visibility =
      window.indexPdfActual === 0 ? "hidden" : "visible";

    btnSeg.style.visibility =
      window.indexPdfActual === window.llistaPdfs.length - 1
        ? "hidden"
        : "visible";
  } else {
    navButtons.style.display = "none";
  }
}

function navegarPdf(direccion) {
  const nouIndex = window.indexPdfActual + direccion;

  if (nouIndex >= 0 && nouIndex < window.llistaPdfs.length) {
    window.indexPdfActual = nouIndex;
    carregarPdfActual();
  }
}
