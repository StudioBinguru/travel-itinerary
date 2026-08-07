const SOURCE = location.pathname.includes("/portugal/flights/")
  ? "../flight_monitoring.md"
  : "./flight_monitoring.md";
const content = document.querySelector("#monitoring-content");
const refreshButton = document.querySelector("#refresh");
document.querySelector("#source-link").href = SOURCE;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function inlineMarkdown(value) {
  let safe = escapeHtml(value);
  safe = safe.replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  return safe;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[·—]/g, "-").replace(/[()]/g, "").replace(/[^\w가-힣]+/g, "-").replace(/^-|-$/g, "");
}

function isDivider(line) {
  return /^\|?\s*:?-{3,}/.test(line) && line.includes("|");
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const label = heading[2];
      html.push(`<h${level} id="${slugify(label)}">${inlineMarkdown(label)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.startsWith("|") && index + 1 < lines.length && isDivider(lines[index + 1])) {
      const rows = [];
      const header = splitRow(line);
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      html.push("<table><thead><tr>" + header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("") + "</tr></thead><tbody>");
      for (const row of rows) {
        html.push("<tr>" + row.map((cell, cellIndex) => `<${cellIndex === 0 ? "th" : "td"}>${inlineMarkdown(cell)}</${cellIndex === 0 ? "th" : "td"}>`).join("") + "</tr>");
      }
      html.push("</tbody></table>");
      continue;
    }

    if (/^-\s+/.test(line)) {
      html.push("<ul>");
      while (index < lines.length && /^-\s+/.test(lines[index].trim())) {
        html.push(`<li>${inlineMarkdown(lines[index].trim().replace(/^-\s+/, ""))}</li>`);
        index += 1;
      }
      html.push("</ul>");
      continue;
    }

    html.push(`<p>${inlineMarkdown(line)}</p>`);
    index += 1;
  }
  return html.join("");
}

function updateSummary(markdown) {
  const tracked = markdown.match(/마지막 추적:\s*([^\n]+)/)?.[1] || "확인 불가";
  const directSection = markdown.match(/## 리스본 왕복 직항[\s\S]*?(?=\n## )/)?.[0] || "";
  const directPrice = directSection.match(/\*\*([\d,]+원)\*\*/)?.[1] || "결과 없음";
  const roundtrip = markdown.match(/리스본 왕복 경유 조건 충족 항공권 \((\d+)개\)/)?.[1] || "0";
  const openjaw = markdown.match(/포르투갈 오픈조 조건 충족 항공권[^\n]*\((\d+)개\)/)?.[1] || "0";

  document.querySelector("#last-tracked").textContent = `마지막 추적 ${tracked}`;
  document.querySelector("#direct-price").textContent = directPrice;
  document.querySelector("#roundtrip-count").textContent = `${roundtrip}개`;
  document.querySelector("#openjaw-count").textContent = `${openjaw}개`;
}

function updateNav(markdown) {
  const navLinks = document.querySelectorAll(".section-nav a");
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
  const findHeading = (word) => headings.find((heading) => heading.includes(word));
  const destinations = [findHeading("직항"), findHeading("리스본 왕복 경유"), findHeading("오픈조"), findHeading("이전 최저가")];
  navLinks.forEach((link, index) => {
    if (destinations[index]) link.href = `#${slugify(destinations[index])}`;
  });
}

async function loadMonitoring() {
  refreshButton.disabled = true;
  refreshButton.textContent = "갱신 중…";
  try {
    const response = await fetch(`${SOURCE}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    updateSummary(markdown);
    updateNav(markdown);
    content.innerHTML = renderMarkdown(markdown);
  } catch (error) {
    content.innerHTML = `<div class="error"><h2>기록을 불러오지 못했어요.</h2><p>잠시 뒤 다시 시도해 주세요. (${escapeHtml(error.message)})</p></div>`;
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "지금 새로고침";
  }
}

refreshButton.addEventListener("click", loadMonitoring);
loadMonitoring();
setInterval(loadMonitoring, 5 * 60 * 1000);
