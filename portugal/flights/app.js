const SOURCE = location.pathname.includes("/portugal/flights/")
  ? "../flight_monitoring.md"
  : "./flight_monitoring.md";
const content = document.querySelector("#monitoring-content");
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
    if (/^마지막 추적:\s*/.test(line)) { index += 1; continue; }

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
  const roundtripSection = markdown.match(/## 리스본 왕복 경유[\s\S]*?(?=\n## )/)?.[0] || "";
  const openjawSection = markdown.match(/## 포르투갈 오픈조[\s\S]*?(?=\n## )/)?.[0] || "";
  const directPrice = directSection.match(/\*\*([\d,]+원)\*\*/)?.[1] || "결과 없음";
  const roundtripPrice = roundtripSection.match(/\*\*([\d,]+원)\*\*/)?.[1] || "결과 없음";
  const openjawPrice = openjawSection.match(/\*\*([\d,]+원)\*\*/)?.[1] || "결과 없음";

  document.querySelector("#last-tracked").textContent = `마지막 추적 ${tracked}`;
  document.querySelector("#direct-price").textContent = directPrice;
  document.querySelector("#roundtrip-price").textContent = roundtripPrice;
  document.querySelector("#openjaw-price").textContent = openjawPrice;
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

function rowValue(table, label) {
  const row = [...table.querySelectorAll("tbody tr")].find((item) => item.querySelector("th")?.textContent.trim() === label);
  return row?.querySelector("td")?.textContent.trim() || "";
}

function firstTime(value) {
  return value.match(/\b\d{2}:\d{2}\b/)?.[0] || "—";
}

function duration(value) {
  return value.match(/(?:총|비행)\s*([^·,]+)/)?.[1]?.trim() || "시간 확인 필요";
}

function stopType(value) {
  return value.match(/직항|경유\s*\d+회/)?.[0] || "운항 정보";
}

function airlineCode(airline) {
  if (airline.includes("대한항공")) return "KE";
  if (airline.includes("아시아나")) return "OZ";
  if (airline.includes("에어프랑스")) return "AF";
  if (airline.includes("KLM")) return "KL";
  return "✈";
}

function airlineNameMarkup(airline) {
  return airline.split(/\s*·\s*/).map(escapeHtml).join(" ·<wbr> ");
}

function enhanceFlightCards() {
  const headings = [...content.querySelectorAll("h3")];

  for (const heading of headings) {
    const table = heading.nextElementSibling;
    if (!table?.matches("table")) continue;

    const airline = rowValue(table, "항공사") || "항공사 확인 필요";
    const travelDate = rowValue(table, "여행일") || heading.textContent.replace(/^\d+\)\s*/, "");
    const outbound = rowValue(table, "가는 편");
    const inbound = rowValue(table, "오는 편");
    const lisbonArrival = rowValue(table, "리스본 도착");
    const seoulArrival = rowValue(table, "인천 도착") || rowValue(table, "서울 도착");
    const price = rowValue(table, "최저 카드가") || "가격 확인 필요";
    const priceOnly = price.match(/[\d,]+원/)?.[0] || price;
    const priceCondition = price.replace(priceOnly, "").replace(/^\s*·\s*/, "") || "결제 조건 없음";
    const inboundOrigin = inbound.includes("포르투") ? "OPO" : "LIS";
    const isLowest = heading.textContent.includes("현재 최저가");
    const longAirline = airline.includes("공동운항") || airline.split("·").length >= 3;

    const card = document.createElement("details");
    card.className = "flight-card";
    const preview = document.createElement("summary");
    preview.className = "flight-preview";
    preview.setAttribute("aria-label", `${airline}, ${travelDate}, ${priceOnly}, 상세정보 펼치기`);
    preview.innerHTML = `
      <div class="flight-airline">
        <span class="airline-mark">${escapeHtml(airlineCode(airline))}</span>
        <span><strong class="airline-name${longAirline ? ' airline-name--long' : ''}">${airlineNameMarkup(airline)}</strong><small>${isLowest ? '<em>현재 최저가</em>' : ''}${escapeHtml(travelDate)}</small></span>
      </div>
      <div class="flight-times">
        <span><b>${escapeHtml(firstTime(outbound))}</b> <i>ICN</i><span class="route-arrow">→</span><b>${escapeHtml(firstTime(lisbonArrival))}</b> <i>LIS</i></span>
        <span><b>${escapeHtml(firstTime(inbound))}</b> <i>${inboundOrigin}</i><span class="route-arrow">→</span><b>${escapeHtml(firstTime(seoulArrival))}</b> <i>ICN</i></span>
      </div>
      <div class="flight-stops">
        <span>${escapeHtml(stopType(outbound))} · ${escapeHtml(duration(lisbonArrival))}</span>
        <span>${escapeHtml(stopType(inbound))} · ${escapeHtml(duration(seoulArrival))}</span>
      </div>
      <div class="flight-price">
        <small>${escapeHtml(priceCondition)}</small>
        <strong>${escapeHtml(priceOnly)}</strong>
      </div>
      <span class="flight-chevron" aria-hidden="true"></span>`;

    const expanded = document.createElement("div");
    expanded.className = "flight-expanded";
    heading.before(card);
    card.append(preview, expanded);
    expanded.append(table);
    heading.remove();
  }
}

async function loadMonitoring() {
  try {
    const response = await fetch(`${SOURCE}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    updateSummary(markdown);
    updateNav(markdown);
    content.innerHTML = renderMarkdown(markdown);
    enhanceFlightCards();
  } catch (error) {
    content.innerHTML = `<div class="error"><h2>기록을 불러오지 못했어요.</h2><p>잠시 뒤 다시 시도해 주세요. (${escapeHtml(error.message)})</p></div>`;
  }
}

loadMonitoring();
setInterval(loadMonitoring, 5 * 60 * 1000);
