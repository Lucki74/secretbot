let currentGuildId = null;
let currentConfig = {};
let currentGuildData = {};
let socket = null;
let casesChart = null;
let modChart = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const authRes = await fetch("/auth/status");
    const authData = await authRes.json();

    if (!authData.authenticated) {
      document.getElementById("login-overlay").classList.remove("hidden");
      return;
    }

    document.getElementById("app").classList.remove("hidden");
    const userInfoEl = document.getElementById("user-info");
    if (userInfoEl) {
      userInfoEl.innerHTML = `
            <div style="flex:1">
                <strong>${authData.user.username}</strong>
            </div>
            <a href="/auth/logout" style="color:var(--danger); text-decoration:none; font-size:0.8rem">Logout</a>
        `;
    }

    socket = io();
    socket.on("log", (data) => {
      if (data.guildId === currentGuildId) {
        appendLog(data.event, data.content);
      }
    });

    fetchGuilds();
    setupTabs();
    setupSaveButtons();
    setupEmbedBuilder();
    setupAutomodActions();
    setupMemberSearch();
    setupCasesSearch();
    setupTagsActions();
    setupHistorySearch();
    setupReactRolesActions();
    setupYAMLValidation();

    const closeBtn = document.getElementById("case-modal-close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        document.getElementById("case-modal").classList.add("hidden");
      };
    }
  } catch (e) {
    console.error("Auth check failed:", e);
  }
});


function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
}

window.closeModal = function (id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
};

function showFormModal(title, fields, callback) {
  const titleEl = document.getElementById("form-modal-title");
  const bodyEl = document.getElementById("form-modal-body");
  const submitBtn = document.getElementById("form-modal-submit");

  if (!titleEl || !bodyEl || !submitBtn) return;

  titleEl.innerText = title;
  bodyEl.innerHTML = "";

  fields.forEach((f) => {
    const label = document.createElement("label");
    label.innerText = f.label;
    let input;
    if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = f.type || "text";
    }
    input.className = "input-text";
    input.id = `form-field-${f.id}`;
    if (f.value) input.value = f.value;
    bodyEl.appendChild(label);
    bodyEl.appendChild(input);
  });

  submitBtn.onclick = () => {
    const results = {};
    fields.forEach((f) => {
      results[f.id] = document.getElementById(`form-field-${f.id}`).value;
    });
    callback(results);
    closeModal("form-modal");
  };

  openModal("form-modal");
}

function setupYAMLValidation() {
  const btn = document.getElementById("validate-yaml-btn");
  if (!btn) return;
  btn.onclick = () => {
    const editor = document.getElementById("yaml-editor");
    try {
      if (typeof jsyaml !== "undefined") {
        jsyaml.load(editor.value);
        showToast("YAML is valid!");
      } else {
        showToast("Validation library not loaded.", "danger");
      }
    } catch (e) {
      showToast("Invalid YAML: " + e.message, "danger");
    }
  };
}

async function fetchGuilds() {
  try {
    const res = await fetch("/api/guilds");
    const guilds = await res.json();
    const list = document.getElementById("server-list");
    if (!list) return;
    list.innerHTML = "";

    if (guilds.length === 0) {
      list.innerHTML =
        '<div style="padding:10px;color:var(--text-secondary)">No managed servers found.</div>';
      return;
    }

    guilds.forEach((g) => {
      const div = document.createElement("div");
      div.className = "server-item";
      div.innerHTML = `<span style="font-size: 1.2rem">${g.icon ? `<img src="${g.icon}" width="20" height="20" style="border-radius:50%">` : "🌐"}</span> ${g.name}`;
      div.onclick = () => loadGuild(g.id, div);
      list.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to fetch guilds:", e);
  }
}

async function loadGuild(id, element) {
  document
    .querySelectorAll(".server-item")
    .forEach((el) => el.classList.remove("active"));
  if (element) element.classList.add("active");

  currentGuildId = id;
  const noSel = document.getElementById("no-selection");
  const dashView = document.getElementById("dashboard-view");
  if (noSel) noSel.classList.add("hidden");
  if (dashView) dashView.classList.remove("hidden");

  const nameEl = document.getElementById("current-server-name");
  if (nameEl) nameEl.innerText = `Server ID: ${id}`;

  try {
    const res = await fetch(`/api/guilds/${id}`);
    const data = await res.json();

    currentGuildData = data;
    currentConfig = data.config || {};

    const updateStat = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val !== undefined && val !== null ? val : "0";
    };

    if (data.stats) {
      updateStat("stat-cases", data.stats.cases);
      updateStat("stat-tags", data.stats.tags);
      updateStat("stat-mutes", data.stats.activeMutes);
      updateStat("stat-bans", data.stats.activeBans);
      updateStat("stat-members", data.stats.memberCount);
      updateStat("stat-online", data.stats.onlineCount);
    }

    if (data.charts) {
      renderCharts(data.charts);
    }

    const editor = document.getElementById("yaml-editor");
    if (editor) editor.value = data.rawConfig || "";

    safeRender(() => renderPlugins(currentConfig));
    safeRender(() => renderLogging(currentConfig, data.channels));
    safeRender(() => renderAutomod(currentConfig));

    fetchCases();
    fetchTags();
    fetchReactRoles();
    fetchPersistRoles();

    const embedChannelSelect = document.getElementById("embed-channel");
    if (embedChannelSelect && data.channels) {
      embedChannelSelect.innerHTML = data.channels
        .filter((c) => c.type === 0)
        .map((c) => `<option value="${c.id}">#${c.name}</option>`)
        .join("");
    }

    const feed = document.getElementById("live-feed");
    if (feed) feed.innerHTML = "";
  } catch (e) {
    console.error("Failed to load guild data:", e);
  }
}

function safeRender(fn) {
  try {
    fn();
  } catch (e) {
    console.error("Render error:", e);
  }
}

function renderCharts(chartsData) {
  if (typeof Chart === "undefined") return;
  if (casesChart) casesChart.destroy();
  if (modChart) modChart.destroy();

  const casesCanvas = document.getElementById("cases-chart");
  if (casesCanvas && chartsData.cases) {
    const casesCtx = casesCanvas.getContext("2d");
    const sortedDates = Object.keys(chartsData.cases).sort();

    casesChart = new Chart(casesCtx, {
      type: "line",
      data: {
        labels: sortedDates.map((d) => d.split("-").slice(1).join("/")),
        datasets: [
          {
            label: "Cases",
            data: sortedDates.map((d) => chartsData.cases[d]),
            borderColor: "#5865F2",
            backgroundColor: "rgba(88, 101, 242, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: "#2d3136" } },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  const modCanvas = document.getElementById("mod-chart");
  if (modCanvas && chartsData.mods) {
    const modCtx = modCanvas.getContext("2d");
    modChart = new Chart(modCtx, {
      type: "bar",
      data: {
        labels: chartsData.mods.map((m) => m.name),
        datasets: [
          {
            label: "Actions",
            data: chartsData.mods.map((m) => m.count),
            backgroundColor: "#5865F2",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: "#2d3136" } },
          x: { grid: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
}

const PLUGIN_DESCRIPTIONS = {
  moderation: "Enable cases, bans, mutes, kicks, warns.",
  logging: "Log member joins/leaves, message edits/deletes, voice activity.",
  automod: "Regex filters and spam detection.",
  starboard: "Pin popular messages to a starboard channel.",
  tags: "Custom text snippets triggered by !tag <name>.",
  welcome: "Send a welcome message when members join.",
};

function renderPlugins(config) {
  const plugins = config.plugins || {};
  const list = document.getElementById("plugin-list");
  if (!list) return;
  list.innerHTML = "";

  const availablePlugins = [
    {
      key: "moderation",
      title: "Moderation Core",
      desc: PLUGIN_DESCRIPTIONS.moderation,
    },
    {
      key: "automod",
      title: "Auto-Moderator",
      desc: PLUGIN_DESCRIPTIONS.automod,
    },
    {
      key: "logging",
      title: "Server Logging",
      desc: PLUGIN_DESCRIPTIONS.logging,
    },
    {
      key: "starboard",
      title: "Starboard",
      desc: PLUGIN_DESCRIPTIONS.starboard,
    },
    { key: "tags", title: "Tags", desc: PLUGIN_DESCRIPTIONS.tags },
    {
      key: "welcome",
      title: "Welcome Message",
      desc: PLUGIN_DESCRIPTIONS.welcome,
    },
  ];

  availablePlugins.forEach((p) => {
    const isEnabled = plugins[p.key] ? plugins[p.key].enabled : false;
    list.innerHTML += `
            <div class="plugin-card">
                <div class="plugin-info">
                    <h3>${p.title} <span class="tooltip-icon" title="${p.desc}">?</span></h3>
                    <p>${p.desc}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-${p.key}" ${isEnabled ? "checked" : ""} onchange="markDirty()">
                    <span class="slider"></span>
                </label>
            </div>
        `;
  });
}

function renderLogging(config, channels) {
  const logging = config.plugins?.logging || { enabled: false, channels: {} };
  const grid = document.getElementById("logging-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!channels) return;

  const events = [
    { key: "default", label: "Default Log Channel" },
    { key: "message_delete", label: "Message Deleted" },
    { key: "message_edit", label: "Message Edited" },
    { key: "member_join", label: "Member Joined" },
    { key: "member_leave", label: "Member Left" },
    { key: "member_update", label: "Role Changes" },
  ];

  const channelOptions =
    '<option value="">-- Disabled --</option>' +
    channels
      .filter((c) => c.type === 0)
      .map((c) => `<option value="${c.id}">#${c.name}</option>`)
      .join("");

  events.forEach((e) => {
    grid.innerHTML += `
            <div class="log-item">
                <label>${e.label}</label>
                <select class="input-select" id="log-${e.key}" onchange="markDirty()">
                    ${channelOptions}
                </select>
            </div>
        `;
  });

  events.forEach((e) => {
    const currentVal = logging.channels?.[e.key] || "";
    const el = document.getElementById(`log-${e.key}`);
    if (el) el.value = currentVal;
  });
}

function renderAutomod(config) {
  const automod = config.plugins?.automod || { rules: [] };
  const tbody = document.getElementById("automod-rules-table");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!automod.rules || automod.rules.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary)">No rules configured.</td></tr>';
    return;
  }

  automod.rules.forEach((rule, idx) => {
    tbody.innerHTML += `
            <tr>
                <td><code style="background:var(--bg-base);padding:2px 4px;border-radius:4px">${rule.pattern}</code></td>
                <td><span style="text-transform:uppercase;font-size:0.8rem;background:var(--accent);padding:2px 6px;border-radius:4px">${rule.action}</span></td>
                <td>${rule.reason || "-"}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:0.8rem" onclick="deleteRule(${idx})">Delete</button>
                </td>
            </tr>
        `;
  });
}

function setupAutomodActions() {
  const btn = document.getElementById("add-rule-btn");
  if (!btn) return;
  btn.onclick = () => {
    showFormModal(
      "Add Automod Rule",
      [
        { id: "pattern", label: "Regex Pattern" },
        {
          id: "action",
          label: "Action (warn, mute, delete, kick, ban)",
          value: "warn",
        },
        { id: "reason", label: "Reason" },
      ],
      (data) => {
        if (!data.pattern) return;
        if (!currentConfig.plugins) currentConfig.plugins = {};
        if (!currentConfig.plugins.automod)
          currentConfig.plugins.automod = { enabled: true, rules: [] };
        if (!currentConfig.plugins.automod.rules)
          currentConfig.plugins.automod.rules = [];

        currentConfig.plugins.automod.rules.push({
          pattern: data.pattern,
          action: data.action,
          reason: data.reason,
        });
        renderAutomod(currentConfig);
        markDirty();
        showToast("Automod rule added!");
      },
    );
  };
}
window.deleteRule = function (idx) {
  currentConfig.plugins.automod.rules.splice(idx, 1);
  renderAutomod(currentConfig);
  markDirty();
  showToast("Automod rule removed!");
};

async function fetchCases(userId = "", page = 1) {
  if (!currentGuildId) return;
  const res = await fetch(
    `/api/guilds/${currentGuildId}/cases?userId=${userId}&page=${page}`,
  );
  if (!res.ok) return;
  const data = await res.json();
  const tbody = document.getElementById("cases-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (data.cases.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center">No cases found.</td></tr>';
    return;
  }
  data.cases.forEach((c) => {
    tbody.innerHTML += `<tr><td>${c.caseNumber}</td><td>${c.type.toUpperCase()}</td><td>${c.userId}</td><td>${c.modId}</td><td>${c.reason || "-"}</td><td>${new Date(c.createdAt).toLocaleDateString()}</td><td><button class="btn btn-secondary" onclick="openCaseModal(${c.id})">View</button></td></tr>`;
  });
}

function setupCasesSearch() {
  const btn = document.getElementById("case-search-btn");
  if (!btn) return;
  btn.onclick = () => {
    const userId = document.getElementById("case-search-input").value;
    fetchCases(userId);
  };
}

async function openCaseModal(caseId) {
  const res = await fetch(`/api/guilds/${currentGuildId}/cases/${caseId}`);
  if (!res.ok) return showToast("Failed to fetch case details.", "danger");
  const caseData = await res.json();
  const modalBody = document.getElementById("case-modal-body");
  if (modalBody) {
    modalBody.innerHTML = `
        <h3>Case #${caseData.caseNumber} - ${caseData.type.toUpperCase()}</h3>
        <p><strong>User:</strong> ${caseData.userTag} (${caseData.userId})</p>
        <p><strong>Moderator:</strong> ${caseData.modTag} (${caseData.modId})</p>
        <p><strong>Reason:</strong> ${caseData.reason || "None"}</p>
        <p><strong>Date:</strong> ${new Date(caseData.createdAt).toLocaleString()}</p>
        ${caseData.notes.length > 0 ? `<h4>Notes:</h4><ul>${caseData.notes.map((n) => `<li>${new Date(n.createdAt).toLocaleString()} - ${n.content}</li>`).join("")}</ul>` : ""}
    `;
  }
  openModal("case-modal");
}

async function fetchTags() {
  if (!currentGuildId) return;
  const res = await fetch(`/api/guilds/${currentGuildId}/tags`);
  if (!res.ok) return;
  const tags = await res.json();
  const tbody = document.getElementById("tags-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (tags.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center">No tags found.</td></tr>';
    return;
  }
  tags.forEach((t) => {
    tbody.innerHTML += `<tr><td>${t.name}</td><td>${t.content}</td><td><button class="btn btn-secondary" onclick="deleteTag('${t.id}', '${t.name}')">Delete</button></td></tr>`;
  });
}

function setupTagsActions() {
  const btn = document.getElementById("add-tag-btn");
  if (!btn) return;
  btn.onclick = async () => {
    showFormModal(
      "Create Tag",
      [
        { id: "name", label: "Tag Name" },
        { id: "content", label: "Tag Content", type: "textarea" },
      ],
      async (data) => {
        if (!data.name || !data.content) return;
        const res = await fetch(`/api/guilds/${currentGuildId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, content: data.content }),
        });
        if (res.ok) {
          showToast("Tag added successfully!");
          fetchTags();
        } else {
          showToast("Failed to add tag.", "danger");
        }
      },
    );
  };
}

window.deleteTag = async (tagId, tagName) => {
  showFormModal(
    `Delete Tag: ${tagName}`,
    [{ id: "confirm", label: "Type DELETE to confirm" }],
    async (data) => {
      if (data.confirm !== "DELETE")
        return showToast("Deletion cancelled.", "danger");
      const res = await fetch(`/api/guilds/${currentGuildId}/tags/${tagId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Tag deleted!");
        fetchTags();
      }
    },
  );
};

function setupHistorySearch() {
  const btn = document.getElementById("history-search-btn");
  if (!btn) return;
  btn.onclick = async () => {
    const userId = document.getElementById("history-search-input").value;
    if (!userId) return;
    const res = await fetch(
      `/api/guilds/${currentGuildId}/namehistory?userId=${userId}`,
    );
    const data = await res.json();
    const tbody = document.getElementById("history-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach((h) => {
      tbody.innerHTML += `<tr><td>${h.username}</td><td>${h.nickname || "-"}</td><td>${new Date(h.recordedAt).toLocaleString()}</td></tr>`;
    });
  };
}

async function fetchReactRoles() {
  if (!currentGuildId) return;
  const res = await fetch(`/api/guilds/${currentGuildId}/reactionroles`);
  const data = await res.json();
  const tbody = document.getElementById("rr-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  data.forEach((rr) => {
    tbody.innerHTML += `<tr><td>${rr.messageId}</td><td>${rr.emoji}</td><td>${rr.roleId}</td><td><button class="btn btn-secondary" onclick="deleteRR(${rr.id})">Delete</button></td></tr>`;
  });
}
function setupReactRolesActions() {
  const btn = document.getElementById("add-rr-btn");
  if (!btn) return;
  btn.onclick = async () => {
    showFormModal(
      "Add Reaction Role",
      [
        { id: "messageId", label: "Message ID" },
        { id: "emoji", label: "Emoji (Unicode or ID)" },
        { id: "roleId", label: "Role ID" },
      ],
      async (data) => {
        if (!data.messageId || !data.emoji || !data.roleId) return;
        const res = await fetch(`/api/guilds/${currentGuildId}/reactionroles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          showToast("Reaction role added!");
          fetchReactRoles();
        }
      },
    );
  };
}
window.deleteRR = async (id) => {
  await fetch(`/api/guilds/${currentGuildId}/reactionroles/${id}`, {
    method: "DELETE",
  });
  showToast("Reaction role removed!");
  fetchReactRoles();
};

async function fetchPersistRoles() {
  if (!currentGuildId) return;
  const res = await fetch(`/api/guilds/${currentGuildId}/persistroles`);
  const data = await res.json();
  const tbody = document.getElementById("persistroles-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  data.forEach((pr) => {
    tbody.innerHTML += `<tr><td>${pr.userId}</td><td>${pr.roleId}</td><td><button class="btn btn-secondary" onclick="deletePersistRole(${pr.id})">Delete</button></td></tr>`;
  });
}
window.deletePersistRole = async (id) => {
  await fetch(`/api/guilds/${currentGuildId}/persistroles/${id}`, {
    method: "DELETE",
  });
  showToast("Persisted role removed!");
  fetchPersistRoles();
};

let autoSaveTimeout = null;
function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      func(...args);
    };
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(later, wait);
  };
}

const triggerAutoSave = debounce(async () => {
  const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
  const statusEl = document.getElementById("save-status");
  if (!statusEl) return;
  statusEl.innerText = "Saving...";
  statusEl.classList.add("show");

  try {
    if (activeTab === "yaml") {
      const rawYaml = document.getElementById("yaml-editor").value;
      const res = await fetch(`/api/guilds/${currentGuildId}/config/raw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: rawYaml }),
      });
      if (res.ok) statusEl.innerText = "Saved";
      else {
        const err = await res.json();
        showToast(err.error || "Save failed", "danger");
        statusEl.innerText = "Error";
      }
    } else {
      const updatedConfig = gatherConfigFromUI();
      const res = await fetch(`/api/guilds/${currentGuildId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (res.ok) {
        const data = await res.json();
        const editor = document.getElementById("yaml-editor");
        if (editor && data.rawConfig) editor.value = data.rawConfig;
        statusEl.innerText = "Saved";
      }
    }
    setTimeout(() => statusEl.classList.remove("show"), 2000);
  } catch (e) {
    statusEl.innerText = "Error Saving";
    statusEl.style.color = "var(--danger)";
  }
}, 1000);

function markDirty() {
  triggerAutoSave();
}

function gatherConfigFromUI() {
  if (!currentConfig.plugins) currentConfig.plugins = {};
  ["moderation", "automod", "logging", "starboard", "tags", "welcome"].forEach(
    (key) => {
      if (!currentConfig.plugins[key]) currentConfig.plugins[key] = {};
      const el = document.getElementById(`toggle-${key}`);
      if (el) currentConfig.plugins[key].enabled = el.checked;
    },
  );
  if (!currentConfig.plugins.logging)
    currentConfig.plugins.logging = { enabled: true, channels: {} };
  if (!currentConfig.plugins.logging.channels)
    currentConfig.plugins.logging.channels = {};
  [
    "default",
    "message_delete",
    "message_edit",
    "member_join",
    "member_leave",
    "member_update",
  ].forEach((key) => {
    const el = document.getElementById(`log-${key}`);
    if (el) {
      if (el.value) currentConfig.plugins.logging.channels[key] = el.value;
      else delete currentConfig.plugins.logging.channels[key];
    }
  });
  return currentConfig;
}

function setupSaveButtons() {
  const editor = document.getElementById("yaml-editor");
  if (editor) {
    editor.addEventListener("input", () => markDirty());
  }
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-pane")
        .forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(`${btn.dataset.tab}-tab`);
      if (target) target.classList.add("active");
    };
  });
}

function appendLog(event, content) {
  const feed = document.getElementById("live-feed");
  if (!feed) return;
  const time = new Date().toLocaleTimeString();
  const div = document.createElement("div");
  div.className = "feed-item";
  div.innerHTML = `<span class="time">[${time}]</span> <span class="event">${event}</span> ${content}`;
  feed.prepend(div);
}

function setupEmbedBuilder() {
  const titleInput = document.getElementById("embed-title");
  const descInput = document.getElementById("embed-desc");
  const colorInput = document.getElementById("embed-color");
  if (!titleInput || !descInput || !colorInput) return;

  const pTitle = document.getElementById("preview-title");
  const pDesc = document.getElementById("preview-desc");
  const pSide = document.getElementById("preview-sidebar");

  const updatePreview = () => {
    if (pTitle) pTitle.innerText = titleInput.value || "Title";
    if (pDesc) pDesc.innerText = descInput.value || "Description";
    if (pSide) pSide.style.backgroundColor = colorInput.value;
  };

  titleInput.addEventListener("input", updatePreview);
  descInput.addEventListener("input", updatePreview);
  colorInput.addEventListener("input", updatePreview);

  const sendBtn = document.getElementById("send-embed-btn");
  if (sendBtn) {
    sendBtn.onclick = async () => {
      const channelId = document.getElementById("embed-channel").value;
      if (!channelId) return showToast("Select a channel", "danger");
      const payload = {
        channelId,
        title: titleInput.value,
        description: descInput.value,
        color: parseInt(colorInput.value.replace("#", ""), 16),
      };
      const res = await fetch(`/api/guilds/${currentGuildId}/send-embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast("Embed Sent!");
      else showToast("Failed to send embed", "danger");
    };
  }
}

function setupMemberSearch() {
  const btn = document.getElementById("member-search-btn");
  if (!btn) return;
  btn.onclick = async () => {
    const input = document.getElementById("member-search-input");
    const query = input ? input.value : "";
    if (!query) return;
    const res = await fetch(
      `/api/guilds/${currentGuildId}/members?q=${encodeURIComponent(query)}`,
    );
    const members = await res.json();
    const tbody = document.getElementById("member-search-results");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (members.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center">No members found.</td></tr>';
      return;
    }
    members.forEach((m) => {
      tbody.innerHTML += `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px">
                            <img src="${m.avatar}" width="30" height="30" style="border-radius:50%">
                            ${m.username}
                        </div>
                    </td>
                    <td><code style="font-size:0.8rem">${m.id}</code></td>
                    <td>${new Date(m.joinedAt).toLocaleDateString()}</td>
                    <td>${m.roles
                      .slice(0, 3)
                      .map(
                        (r) =>
                          `<span style="color:${r.color}">${r.name}</span>`,
                      )
                      .join(", ")} ${m.roles.length > 3 ? "..." : ""}</td>
                </tr>
            `;
    });
  };
}
