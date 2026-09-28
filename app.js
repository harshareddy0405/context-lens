(() => {
  "use strict";

  const STORAGE_KEY = "context-lens-v1";
  const DEFAULT_QUERY =
    "Why do users trust the product during high-pressure incidents?";
  const TOKEN_BUDGET = 1200;
  const STOP_WORDS = new Set(
    "a an and are as at be been by can could did do does for from had has have how i if in into is it its may more most not of on or our should so than that the their then there these they this to was we were what when where which who why will with would you your".split(
      " ",
    ),
  );

  const seedDocuments = [
    {
      id: "incident-trust",
      title: "Incident trust field notes",
      type: "Research synthesis",
      color: "#3158df",
      custom: false,
      text: `Trust during a high-pressure incident is earned before the incident starts. Across eleven interviews, experienced operators described confidence as the product of three repeated signals: the system states what it knows, distinguishes observation from inference, and leaves a visible path for a human override. A polished interface mattered less than a legible account of what had happened and what would happen next.

Operators did not ask for total automation. In fact, the strongest negative reactions appeared when the product acted decisively without exposing its evidence. A site reliability lead said that speed without provenance feels like another incident to manage. Teams trusted recommendations when the interface showed the source events, the rule or pattern that connected them, and the expected consequence of the proposed action.

The first ninety seconds shaped the rest of the session. Users scanned for scope, severity, and recency before reading any narrative summary. Compact status language reduced uncertainty: affected services, last verified signal, active owner, and the next scheduled check. When those fields were missing, people opened parallel dashboards and stopped treating the product as a reliable center of gravity.

Calm interaction design created a second trust layer. During pressure, motion was interpreted as change, not decoration. Persistent placement, restrained color, and stable labels helped operators maintain a mental map. Confirmation steps were welcome for destructive actions but frustrating for reversible investigation. The best pattern was preview, explain, act, and preserve an undo path.

Teams also differentiated confidence from certainty. They preferred calibrated language such as likely, supported by, and not yet verified. Numerical confidence alone was rarely persuasive because users could not tell what produced it. A short evidence trail—three relevant signals and one contradictory signal—made uncertainty useful rather than alarming.

Handoffs were a recurring failure point. Incoming responders needed a compressed account of decisions, not only a transcript of events. The most trusted handoff included the current hypothesis, evidence already checked, actions taken, actions rejected, and the name of the person holding incident command. This structure prevented repeated work and made accountability feel supportive rather than punitive.

After the incident, trust was reinforced when the same evidence remained inspectable. Operators wanted to replay the sequence and see whether an automated recommendation would change with new data. Products that rewrote history or hid intermediate states were described as impossible to learn from. Reproducibility turned a one-time answer into organizational memory.

The design implication is straightforward: trustworthy incident tooling should optimize for legibility under stress. Show the boundary of knowledge, connect recommendations to evidence, keep the interaction map stable, and let humans interrupt the plan. Automation becomes credible when it behaves like a transparent teammate rather than an invisible authority.`,
    },
    {
      id: "aurora-brief",
      title: "Aurora product brief",
      type: "Product strategy",
      color: "#f06a35",
      custom: false,
      text: `Aurora is a collaborative decision workspace for product teams. It collects research fragments, connects them to open decisions, and creates a lightweight record of why a team chose one path over another. The initial audience is a cross-functional product trio working across several time zones.

The core problem is not a shortage of information. Teams have documents, recordings, issue trackers, and dashboards. The problem is that evidence becomes detached from the decision it influenced. Weeks later, a reasonable choice can look arbitrary because assumptions and rejected alternatives have disappeared from view.

Aurora organizes work around decision rooms. A room begins with a question, a named owner, a due date, and explicit success criteria. Members attach evidence cards that preserve a source link and a short interpretation. The workspace distinguishes facts, assumptions, constraints, and opinions so disagreement becomes easier to locate.

The first release includes evidence capture, decision framing, asynchronous review, and a decision record. It intentionally excludes project planning and long-form document editing. Integrations should point to the original system rather than copy entire repositories of content. This keeps Aurora focused and reduces the risk of becoming another place teams must keep synchronized.

Success will be measured by decision cycle time, review participation, and the percentage of decisions that retain at least two linked evidence sources after thirty days. Activity volume is not a goal. A healthy workspace can be quiet if it gives the right participant enough context to make a confident contribution.

The interaction principle is progressive disclosure. A visitor should understand the question and current recommendation in under a minute, then open evidence or discussion only when needed. Status must be visible without turning the room into a dashboard. The tone should feel considered, calm, and specific rather than urgent by default.

The main product risk is performative documentation: teams may fill fields without improving decisions. Templates must remain small, and every required input must have a clear downstream use. Another risk is false consensus. The review flow should make dissent safe and preserve meaningful objections even after a decision closes.

Aurora will begin as a browser application with exportable records. Enterprise controls, automated synthesis, and advanced integrations belong in later phases. Any future AI feature must cite the evidence it used, expose uncertainty, and allow the team to edit or reject the generated interpretation.`,
    },
    {
      id: "retrieval-memo",
      title: "Retrieval evaluation memo",
      type: "Technical note",
      color: "#207968",
      custom: false,
      text: `Retrieval quality should be evaluated as a pipeline, not as a single similarity number. The corpus, segmentation policy, query formulation, ranking method, and context assembly step each create distinct failure modes. A useful evaluation names the stage at which relevant evidence was lost.

Chunk size changes both recall and interpretability. Very small chunks can match a phrase precisely but omit the qualification that follows it. Large chunks preserve narrative structure while consuming more of the context budget and introducing unrelated language. The right size depends on document style, query shape, and the downstream task.

Overlap protects ideas that cross a boundary, but it also duplicates evidence. When adjacent chunks both rank highly, the context window may contain repeated sentences while another relevant section is excluded. Evaluation should measure unique evidence coverage in addition to conventional top-k recall.

Lexical methods remain valuable for inspection because their matches are easy to explain. They work well for names, error codes, product terminology, and quoted phrases. They struggle when the query and source use different vocabulary. Dense retrieval can bridge that vocabulary gap, but an embedding score is not a guarantee of factual relevance.

A practical test set includes direct lookup questions, paraphrased questions, questions that require two distant sections, and unanswerable questions. The last category matters: a retriever should not manufacture confidence when the corpus lacks evidence. Record the highest irrelevant score and examine how often a low-evidence query still fills the requested top-k slots.

Ranking metrics alone do not reveal context usefulness. Inspect the exact text delivered downstream. Look for severed references, missing headings, duplicated passages, stale versions, and conflicting claims. A human evaluator should be able to trace every assembled block to a stable source position.

Production systems need observability at query time. Log the retrieval policy version, corpus snapshot, chunk identifiers, raw scores, filters, and final context order. Do not log private source text by default. A replay tool can then reconstruct behavior from identifiers inside an appropriately controlled environment.

This memo recommends a layered evaluation: start with a transparent lexical baseline, add richer retrieval only when a documented failure justifies it, and keep an inspectable trace through context assembly. Improvement means answering more supported questions with less irrelevant context, not merely increasing an average similarity score.`,
    },
  ];

  const examplesByDocument = {
    "incident-trust": [
      "Why do users trust the product during high-pressure incidents?",
      "What should a trustworthy handoff contain?",
      "How should uncertainty and evidence be shown?",
    ],
    "aurora-brief": [
      "What are the risks of performative documentation?",
      "How does a decision room organize evidence?",
      "How will Aurora measure success?",
    ],
    "retrieval-memo": [
      "How does chunk overlap affect evidence coverage?",
      "How should retrieval quality be evaluated?",
      "Why keep a transparent lexical baseline?",
    ],
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [
    ...scope.querySelectorAll(selector),
  ];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let storageAvailable = true;
  let state = loadState();
  let chunks = [];
  let results = [];
  let selectedChunkId = null;
  let contextIds = [];
  let chunkDebounce = null;

  function defaultState() {
    return {
      documents: clone(seedDocuments),
      selectedDocumentId: seedDocuments[0].id,
      chunkSize: 52,
      overlap: 12,
      strategy: "semantic",
      topK: 3,
      scoreModel: "hybrid",
      theme: "light",
      view: "cards",
      query: DEFAULT_QUERY,
      runCount: 0,
    };
  }

  function loadState() {
    const fallback = defaultState();
    try {
      const saved = JSON.parse(WorkspaceStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || !Array.isArray(saved.customDocuments)) return fallback;
      const documents = [
        ...clone(seedDocuments),
        ...saved.customDocuments.filter(validDocument),
      ];
      const selectedDocumentId = documents.some(
        (doc) => doc.id === saved.selectedDocumentId,
      )
        ? saved.selectedDocumentId
        : documents[0].id;
      return { ...fallback, ...saved, documents, selectedDocumentId };
    } catch (error) {
      storageAvailable = false;
      return fallback;
    }
  }

  function validDocument(doc) {
    return (
      doc &&
      typeof doc.id === "string" &&
      typeof doc.title === "string" &&
      typeof doc.text === "string"
    );
  }
  function persist() {
    if (!storageAvailable) return;
    try {
      WorkspaceStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          customDocuments: state.documents.filter((doc) => doc.custom),
          selectedDocumentId: state.selectedDocumentId,
          chunkSize: state.chunkSize,
          overlap: state.overlap,
          strategy: state.strategy,
          topK: state.topK,
          scoreModel: state.scoreModel,
          theme: state.theme,
          view: state.view,
          query: state.query,
          runCount: state.runCount,
        }),
      );
    } catch (error) {
      storageAvailable = false;
      toast("Browser storage is unavailable; this lab is temporary.");
    }
  }

  function currentDocument() {
    return (
      state.documents.find((doc) => doc.id === state.selectedDocumentId) ||
      state.documents[0]
    );
  }
  function tokenize(text, keepStops = true) {
    const raw =
      String(text)
        .toLowerCase()
        .match(/[a-z0-9][a-z0-9'-]*/g) || [];
    const stemmed = raw.map(stem);
    return keepStops
      ? stemmed
      : stemmed.filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  }
  function stem(token) {
    if (token.length > 6 && token.endsWith("ing")) return token.slice(0, -3);
    if (token.length > 5 && token.endsWith("ed")) return token.slice(0, -2);
    if (token.length > 4 && token.endsWith("ies"))
      return `${token.slice(0, -3)}y`;
    if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss"))
      return token.slice(0, -1);
    return token;
  }

  function rebuildChunks({ preserveQuery = false } = {}) {
    const doc = currentDocument();
    chunks = doc
      ? chunkDocument(doc.text, state.chunkSize, state.overlap, state.strategy)
      : [];
    selectedChunkId = null;
    if (preserveQuery && state.query.trim())
      runRetrieval({ increment: false, announce: false });
    else {
      results = [];
      contextIds = [];
      renderAll();
    }
    persist();
  }

  function chunkDocument(text, target, overlap, strategy) {
    const normalized = text.trim().replace(/\r/g, "");
    if (!normalized) return [];
    if (strategy === "fixed") return fixedChunks(normalized, target, overlap);
    if (strategy === "paragraph")
      return paragraphChunks(normalized, target, overlap);
    return semanticChunks(normalized, target, overlap);
  }

  function fixedChunks(text, target, overlap) {
    const words = text.split(/\s+/);
    const units = [];
    const step = Math.max(1, target - Math.min(overlap, target - 1));
    for (let start = 0; start < words.length; start += step) {
      const slice = words.slice(start, start + target);
      if (!slice.length) break;
      units.push(
        makeChunk(
          units.length,
          slice.join(" "),
          start,
          start + slice.length - 1,
        ),
      );
      if (start + target >= words.length) break;
    }
    return units;
  }

  function semanticChunks(text, target, overlap) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const units = [];
    let bucket = [];
    let start = 0;
    let cursor = 0;
    sentences.forEach((sentence) => {
      const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean);
      if (bucket.length && bucket.length + sentenceWords.length > target) {
        units.push(
          makeChunk(
            units.length,
            bucket.join(" "),
            start,
            start + bucket.length - 1,
          ),
        );
        const carry =
          overlap > 0 ? bucket.slice(-Math.min(overlap, bucket.length)) : [];
        start = Math.max(0, cursor - carry.length);
        bucket = carry;
      }
      bucket.push(...sentenceWords);
      cursor += sentenceWords.length;
    });
    if (bucket.length)
      units.push(
        makeChunk(
          units.length,
          bucket.join(" "),
          start,
          start + bucket.length - 1,
        ),
      );
    return units;
  }

  function paragraphChunks(text, target, overlap) {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const units = [];
    let cursor = 0;
    paragraphs.forEach((paragraph) => {
      const words = paragraph.split(/\s+/);
      if (words.length > target * 1.35) {
        fixedChunks(paragraph, target, overlap).forEach((unit) => {
          units.push(
            makeChunk(
              units.length,
              unit.text,
              cursor + unit.wordStart,
              cursor + unit.wordEnd,
            ),
          );
        });
      } else {
        units.push(
          makeChunk(units.length, paragraph, cursor, cursor + words.length - 1),
        );
      }
      cursor += words.length;
    });
    return units;
  }

  function makeChunk(index, text, wordStart, wordEnd) {
    return {
      id: `C${String(index + 1).padStart(2, "0")}`,
      index,
      text,
      wordStart,
      wordEnd,
      wordCount: text.split(/\s+/).length,
    };
  }

  function runRetrieval({ increment = true, announce = true } = {}) {
    const query = $("#queryInput").value.trim();
    $("#queryError").textContent = "";
    if (!query) {
      $("#queryError").textContent =
        "Enter a question or phrase before running retrieval.";
      $("#queryInput").focus();
      return;
    }
    if (!chunks.length) {
      $("#queryError").textContent =
        "The selected document has no retrievable text.";
      return;
    }
    state.query = query;
    if (increment) state.runCount += 1;
    const queryTokens = [...new Set(tokenize(query, false))];
    results = chunks
      .map((chunk) => scoreChunk(chunk, query, queryTokens))
      .sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index);
    const meaningful = results.filter((result) => result.score > 0.015);
    contextIds = meaningful
      .slice(0, state.topK)
      .map((result) => result.chunk.id);
    selectedChunkId = meaningful[0]?.chunk.id || results[0]?.chunk.id || null;
    renderAll();
    persist();
    if (announce) {
      if (meaningful.length)
        toast(
          `Retrieved ${Math.min(state.topK, meaningful.length)} of ${chunks.length} chunks for context.`,
        );
      else
        toast(
          "No meaningful lexical evidence found. Try different terms or another document.",
        );
    }
  }

  function scoreChunk(chunk, query, queryTokens) {
    const chunkTokens = tokenize(chunk.text, false);
    const tokenSet = new Set(chunkTokens);
    const matchedTerms = queryTokens.filter((term) => tokenSet.has(term));
    const coverage = queryTokens.length
      ? matchedTerms.length / queryTokens.length
      : 0;
    const occurrences = chunkTokens.filter((token) =>
      queryTokens.includes(token),
    ).length;
    const density = Math.min(
      1,
      occurrences / Math.max(3, chunkTokens.length * 0.08),
    );
    const queryPhrase = tokenize(query, true).join(" ");
    const phrase =
      queryPhrase.length > 8 &&
      tokenize(chunk.text, true).join(" ").includes(queryPhrase)
        ? 1
        : 0;
    let score;
    if (state.scoreModel === "keyword") score = density * 0.8 + coverage * 0.2;
    else if (state.scoreModel === "coverage") score = coverage;
    else score = coverage * 0.66 + density * 0.24 + phrase * 0.1;
    const positionTieBreak = Math.max(0, 0.004 - chunk.index * 0.0001);
    return {
      chunk,
      score: Math.min(1, score + (score ? positionTieBreak : 0)),
      coverage,
      density,
      phrase,
      matchedTerms,
    };
  }

  function renderAll() {
    document.documentElement.dataset.theme = state.theme;
    $("#themeButton").textContent = state.theme === "light" ? "◐" : "☼";
    renderDocuments();
    renderControls();
    renderDiagnostics();
    renderChunks();
    renderInspector();
    renderContext();
  }

  function renderDocuments() {
    const list = $("#documentList");
    list.innerHTML = "";
    state.documents.forEach((doc, index) => {
      const card = document.createElement("div");
      card.className = `document-card${doc.id === state.selectedDocumentId ? " active" : ""}`;
      card.setAttribute("role", "listitem");
      card.tabIndex = 0;
      card.setAttribute(
        "aria-label",
        `${doc.title}, ${wordCount(doc.text)} words${doc.id === state.selectedDocumentId ? ", selected" : ""}`,
      );
      card.innerHTML = `<span class="doc-index">${String(index + 1).padStart(2, "0")}</span><span class="doc-info"><strong>${escapeHtml(doc.title)}</strong><small>${escapeHtml(doc.type)} · ${wordCount(doc.text)} words</small></span><span class="doc-status"></span>${doc.custom ? '<button class="doc-delete" type="button" aria-label="Remove custom document">×</button>' : ""}`;
      card.addEventListener("click", (event) => {
        if (!event.target.closest(".doc-delete")) selectDocument(doc.id);
      });
      card.addEventListener("keydown", (event) => {
        if (
          (event.key === "Enter" || event.key === " ") &&
          !event.target.closest(".doc-delete")
        ) {
          event.preventDefault();
          selectDocument(doc.id);
        }
      });
      $(".doc-delete", card)?.addEventListener("click", () =>
        deleteDocument(doc.id),
      );
      list.append(card);
    });
  }

  function renderControls() {
    $("#chunkSize").value = state.chunkSize;
    $("#chunkOverlap").value = state.overlap;
    $("#topK").value = state.topK;
    $("#splitStrategy").value = state.strategy;
    $("#scoreModel").value = state.scoreModel;
    $("#chunkSizeValue").textContent = `${state.chunkSize} words`;
    $("#overlapValue").textContent = `${state.overlap} words`;
    $("#topKValue").textContent =
      `${state.topK} chunk${state.topK === 1 ? "" : "s"}`;
    setRangeProgress($("#chunkSize"));
    setRangeProgress($("#chunkOverlap"));
    setRangeProgress($("#topK"));
    $$(".segmented button").forEach((button) => {
      const active = button.dataset.view === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("#runHistory").textContent =
      `RUN ${String(state.runCount).padStart(2, "0")}`;
  }

  function renderDiagnostics() {
    const doc = currentDocument();
    const contextResults = contextIds.map(resultById).filter(Boolean);
    const contextWords = contextResults.reduce(
      (sum, result) => sum + result.chunk.wordCount,
      0,
    );
    const tokens = estimateTokens(contextWords);
    $("#diagDocument").textContent = doc?.title || "No source";
    $("#diagDocWords").textContent = `${doc ? wordCount(doc.text) : 0} words`;
    $("#diagChunks").textContent =
      `${chunks.length} unit${chunks.length === 1 ? "" : "s"}`;
    $("#diagStrategy").textContent = {
      semantic: "sentence aware",
      fixed: "fixed window",
      paragraph: "paragraph first",
    }[state.strategy];
    $("#diagMatches").textContent = results.length
      ? `${results.filter((result) => result.score > 0.015).length} matches`
      : "Not run";
    $("#diagModel").textContent = {
      hybrid: "hybrid lexical",
      keyword: "keyword overlap",
      coverage: "query coverage",
    }[state.scoreModel];
    $("#diagYield").textContent = `${tokens} tokens`;
    $("#diagYieldRate").textContent =
      `${Math.min(100, Math.round((tokens / TOKEN_BUDGET) * 100))}% of budget`;
  }

  function renderChunks() {
    const grid = $("#chunkGrid");
    grid.className = `chunk-grid${state.view === "map" ? " map-view" : ""}`;
    grid.innerHTML = "";
    if (!chunks.length) {
      grid.innerHTML =
        '<div class="chunk-empty"><div><span>∅</span><h3>No chunks to inspect</h3><p>Add a document with enough plain text or select another source from the library.</p></div></div>';
      return;
    }
    const orderedChunks = results.length
      ? [...chunks].sort((a, b) => {
          const aIncluded = contextIds.indexOf(a.id);
          const bIncluded = contextIds.indexOf(b.id);
          if (aIncluded !== -1 || bIncluded !== -1)
            return (
              (aIncluded === -1 ? 99 : aIncluded) -
              (bIncluded === -1 ? 99 : bIncluded)
            );
          return a.index - b.index;
        })
      : chunks;
    const maxWords = Math.max(...chunks.map((chunk) => chunk.wordCount));
    orderedChunks.forEach((chunk) => {
      const result = resultById(chunk.id);
      const rank = result ? results.indexOf(result) + 1 : null;
      const included = contextIds.includes(chunk.id);
      const card = document.createElement("article");
      card.className = `chunk-card${included ? " retrieved" : ""}${selectedChunkId === chunk.id ? " selected" : ""}`;
      card.tabIndex = 0;
      card.dataset.chunkId = chunk.id;
      card.style.setProperty(
        "--chunk-color",
        included ? currentDocument().color : "var(--line-dark)",
      );
      card.style.setProperty(
        "--map-width",
        `${82 + (chunk.wordCount / maxWords) * 100}px`,
      );
      card.setAttribute(
        "aria-label",
        `${chunk.id}, ${chunk.wordCount} words${included ? ", retrieved for context" : ""}`,
      );
      card.innerHTML = `<div class="chunk-top"><span class="chunk-id">${chunk.id} / W${chunk.wordStart}–${chunk.wordEnd}</span><span class="score-pill ${included ? "high" : ""}">${included ? `<b class="rank-badge">${contextIds.indexOf(chunk.id) + 1}</b>` : ""}${result ? result.score.toFixed(2) : "unscored"}</span></div><blockquote>${highlightText(chunk.text, result?.matchedTerms || [])}</blockquote><div class="chunk-foot"><span>${chunk.wordCount} words · ~${estimateTokens(chunk.wordCount)} tok</span><span>score<div class="score-line"><i style="width:${(result?.score || 0) * 100}%"></i></div></span></div>`;
      card.addEventListener("click", () => {
        selectedChunkId = chunk.id;
        renderChunks();
        renderInspector();
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedChunkId = chunk.id;
          renderChunks();
          renderInspector();
        }
      });
      grid.append(card);
    });
  }

  function renderInspector() {
    const inspector = $("#chunkInspector");
    const chunk = chunks.find((item) => item.id === selectedChunkId);
    if (!chunk) {
      inspector.innerHTML =
        '<div class="inspector-empty"><span>⌖</span><h3>Inspect a chunk</h3><p>Select any block to see its boundaries, retrieval score, matching terms, and context status.</p></div>';
      return;
    }
    const result = resultById(chunk.id);
    const included = contextIds.includes(chunk.id);
    const terms = result?.matchedTerms || [];
    inspector.innerHTML = `<div class="inspector-head"><div><span>${chunk.id} / DETAIL</span><b>${included ? "IN CONTEXT" : "AVAILABLE"}</b></div><h3>Chunk ${chunk.index + 1}</h3><p>WORDS ${chunk.wordStart}–${chunk.wordEnd} · ~${estimateTokens(chunk.wordCount)} TOKENS</p></div><div class="inspector-body"><p class="inspector-text">${highlightText(chunk.text, terms)}</p><div class="score-breakdown"><div class="score-row"><span>query coverage</span><div class="bar"><i style="width:${(result?.coverage || 0) * 100}%"></i></div><strong>${Math.round((result?.coverage || 0) * 100)}%</strong></div><div class="score-row"><span>term density</span><div class="bar"><i style="width:${(result?.density || 0) * 100}%"></i></div><strong>${Math.round((result?.density || 0) * 100)}%</strong></div><div class="score-row"><span>final score</span><div class="bar"><i style="width:${(result?.score || 0) * 100}%"></i></div><strong>${(result?.score || 0).toFixed(2)}</strong></div></div><div class="term-list">${terms.length ? terms.map((term) => `<span>${escapeHtml(term)}</span>`).join("") : '<span class="no-terms">no matched terms</span>'}</div><button class="inspector-action" id="toggleContextButton" type="button">${included ? "Remove from context" : "Pin into context"}</button></div>`;
    $("#toggleContextButton").addEventListener("click", () =>
      toggleContext(chunk.id),
    );
  }

  function renderContext() {
    const output = $("#contextOutput");
    const contextResults = contextIds
      .map((id) => ({
        chunk: chunks.find((chunk) => chunk.id === id),
        result: resultById(id),
      }))
      .filter((item) => item.chunk);
    const contextWords = contextResults.reduce(
      (sum, item) => sum + item.chunk.wordCount,
      0,
    );
    const tokens = estimateTokens(contextWords);
    $("#budgetLabel").textContent =
      `${tokens.toLocaleString()} / ${TOKEN_BUDGET.toLocaleString()} tokens`;
    $("#budgetBar").style.width =
      `${Math.min(100, (tokens / TOKEN_BUDGET) * 100)}%`;
    if (!contextResults.length) {
      const noMatch = results.length;
      output.innerHTML = `<div class="context-empty"><span>${noMatch ? "∅" : "↳"}</span><h3>${noMatch ? "No supported context found" : "Run a retrieval to assemble context"}</h3><p>${noMatch ? "No chunk shared meaningful lexical terms with this query. Try a more specific phrase or change source documents." : "The highest-scoring chunks will appear here with their source positions and synthetic relevance scores."}</p></div>`;
      return;
    }
    output.innerHTML = contextResults
      .map(
        ({ chunk, result }, index) =>
          `<article class="context-block"><div class="context-source">[${index + 1}] ${chunk.id}<span>W${chunk.wordStart}–${chunk.wordEnd}</span><span>${result ? result.score.toFixed(2) : "pinned"}</span></div><p>${highlightText(chunk.text, result?.matchedTerms || [])}</p></article>`,
      )
      .join("");
  }

  function selectDocument(id) {
    if (id === state.selectedDocumentId) return;
    state.selectedDocumentId = id;
    rebuildChunks({ preserveQuery: true });
    toast(`Source changed to ${currentDocument().title}.`);
  }

  function toggleContext(id) {
    if (contextIds.includes(id))
      contextIds = contextIds.filter((item) => item !== id);
    else contextIds.push(id);
    renderAll();
    toast(
      contextIds.includes(id)
        ? `${id} pinned into context.`
        : `${id} removed from context.`,
    );
  }

  function addDocument(event) {
    event.preventDefault();
    const title = $("#documentTitle").value.trim();
    const text = $("#documentText").value.trim();
    if (!title || text.length < 80) return;
    const doc = {
      id: `local-${Date.now().toString(36)}`,
      title,
      text,
      type: "Local document",
      color: "#e9bb43",
      custom: true,
    };
    state.documents.push(doc);
    state.selectedDocumentId = doc.id;
    $("#documentDialog").close();
    $("#documentForm").reset();
    $("#characterCount").textContent = "0";
    rebuildChunks({ preserveQuery: false });
    toast(`${title} added locally.`);
  }

  function deleteDocument(id) {
    const doc = state.documents.find((item) => item.id === id);
    if (!doc?.custom) return;
    state.documents = state.documents.filter((item) => item.id !== id);
    if (state.selectedDocumentId === id)
      state.selectedDocumentId = state.documents[0].id;
    rebuildChunks({ preserveQuery: false });
    toast(`${doc.title} removed from this browser.`);
  }

  function resetWorkspace() {
    state = defaultState();
    results = [];
    contextIds = [];
    selectedChunkId = null;
    $("#queryInput").value = state.query;
    rebuildChunks({ preserveQuery: true });
    persist();
    toast("Lab restored to the original corpus and controls.");
  }

  function resultById(id) {
    return results.find((result) => result.chunk.id === id);
  }
  function estimateTokens(words) {
    return Math.round(words * 1.34);
  }
  function wordCount(text) {
    return String(text).trim() ? String(text).trim().split(/\s+/).length : 0;
  }
  function setRangeProgress(input) {
    const percentage =
      ((Number(input.value) - Number(input.min)) /
        (Number(input.max) - Number(input.min))) *
      100;
    input.style.setProperty("--range-progress", `${percentage}%`);
  }
  function highlightText(text, terms) {
    let safe = escapeHtml(text);
    const unique = [...new Set(terms)]
      .filter((term) => term.length > 1)
      .sort((a, b) => b.length - a.length);
    unique.forEach((term) => {
      safe = safe.replace(
        new RegExp(`\\b(${escapeRegExp(term)}(?:s|ed|ing)?)\\b`, "gi"),
        "<mark>$1</mark>",
      );
    });
    return safe;
  }
  function escapeHtml(value) {
    return String(value).replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  }
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function contextAsText() {
    const doc = currentDocument();
    return contextIds
      .map((id, index) => {
        const chunk = chunks.find((item) => item.id === id);
        const result = resultById(id);
        return chunk
          ? `[${index + 1}] ${doc.title} · ${chunk.id} · words ${chunk.wordStart}-${chunk.wordEnd} · score ${result ? result.score.toFixed(3) : "manually-pinned"}\n${chunk.text}`
          : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  async function copyContext() {
    const text = contextAsText();
    if (!text) {
      toast("Run a retrieval before copying context.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Assembled context copied to clipboard.");
    } catch (error) {
      toast("Clipboard access was blocked. Use Export instead.");
    }
  }

  function exportContext() {
    const text = contextAsText();
    if (!text) {
      toast("Run a retrieval before exporting context.");
      return;
    }
    const header = `# Context Lens export\n\nQuery: ${state.query}\nSource: ${currentDocument().title}\nPolicy: ${state.strategy}, top-${state.topK}, ${state.scoreModel}\nDisclaimer: deterministic lexical simulation; no embeddings or model calls.\n\n`;
    const blob = new Blob([header + text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `context-lens-${currentDocument().id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Context trace exported as plain text.");
  }

  function toast(message) {
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    $("#toastRegion").append(item);
    setTimeout(() => {
      item.classList.add("out");
      setTimeout(() => item.remove(), 200);
    }, 2700);
  }

  function scheduleRebuild() {
    clearTimeout(chunkDebounce);
    chunkDebounce = setTimeout(
      () => rebuildChunks({ preserveQuery: Boolean(results.length) }),
      110,
    );
  }

  function bindEvents() {
    $("#queryForm").addEventListener("submit", (event) => {
      event.preventDefault();
      runRetrieval();
    });
    $("#queryInput").addEventListener("input", (event) => {
      state.query = event.target.value;
      $("#queryError").textContent = "";
      persist();
    });
    $("#exampleButton").addEventListener("click", () => {
      const examples = examplesByDocument[state.selectedDocumentId] || [
        "What are the main themes in this document?",
        "What evidence supports the central recommendation?",
      ];
      const current = examples.indexOf($("#queryInput").value);
      $("#queryInput").value =
        examples[(current + 1 + examples.length) % examples.length];
      runRetrieval();
    });
    [
      ["#chunkSize", "chunkSize"],
      ["#chunkOverlap", "overlap"],
    ].forEach(([selector, key]) => {
      $(selector).addEventListener("input", (event) => {
        state[key] = Number(event.target.value);
        renderControls();
        scheduleRebuild();
      });
    });
    $("#topK").addEventListener("input", (event) => {
      state.topK = Number(event.target.value);
      renderControls();
      if (results.length) runRetrieval({ increment: false, announce: false });
      else persist();
    });
    $("#splitStrategy").addEventListener("change", (event) => {
      state.strategy = event.target.value;
      rebuildChunks({ preserveQuery: Boolean(results.length) });
    });
    $("#scoreModel").addEventListener("change", (event) => {
      state.scoreModel = event.target.value;
      if (results.length) runRetrieval({ increment: false, announce: false });
      else {
        persist();
        renderAll();
      }
    });
    $("#defaultControlsButton").addEventListener("click", () => {
      state.chunkSize = 52;
      state.overlap = 12;
      state.strategy = "semantic";
      rebuildChunks({ preserveQuery: Boolean(results.length) });
      toast("Segmentation defaults restored.");
    });
    $$(".segmented button").forEach((button) =>
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        persist();
        renderControls();
        renderChunks();
      }),
    );
    $("#themeButton").addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      persist();
      renderAll();
    });
    $("#resetButton").addEventListener("click", resetWorkspace);
    $("#copyContextButton").addEventListener("click", copyContext);
    $("#exportContextButton").addEventListener("click", exportContext);
    $("#addDocumentButton").addEventListener("click", () => {
      $("#documentDialog").showModal();
      $("#documentTitle").focus();
    });
    $("#documentForm").addEventListener("submit", addDocument);
    $("#documentText").addEventListener("input", (event) => {
      $("#characterCount").textContent =
        event.target.value.length.toLocaleString();
    });
    $$(".close-document").forEach((button) =>
      button.addEventListener("click", () => $("#documentDialog").close()),
    );
    $("#infoButton").addEventListener("click", () =>
      $("#infoDialog").showModal(),
    );
    $$(".close-info").forEach((button) =>
      button.addEventListener("click", () => $("#infoDialog").close()),
    );
    $$(".pipeline-nav button").forEach((button) =>
      button.addEventListener("click", () => {
        document
          .getElementById(button.dataset.jump)
          .scrollIntoView({ behavior: "smooth", block: "start" });
        $$(".pipeline-nav button").forEach((item) =>
          item.classList.toggle("active", item === button),
        );
      }),
    );
    $$("dialog").forEach((dialog) =>
      dialog.addEventListener("click", (event) => {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }),
    );
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runRetrieval();
      }
      if (
        event.key === "/" &&
        !event.target.matches("input, textarea, select") &&
        !$("dialog[open]")
      ) {
        event.preventDefault();
        $("#queryInput").focus();
        $("#queryInput").select();
      }
    });
  }

  $("#queryInput").value = state.query;
  bindEvents();
  rebuildChunks({ preserveQuery: true });
  if (!storageAvailable)
    setTimeout(
      () =>
        toast("Local storage is unavailable; changes last for this tab only."),
      500,
    );
})();
