// Rikkyo-like tweaks for dates and immediate re-render (news.html)
(function () {
  const w = window;
  const dow = ["日", "月", "火", "水", "木", "金", "土"];
  if (typeof w.formatDate === "function") {
    w.formatDate = function formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}/${mm}/${dd} (${dow[date.getDay()]})`;
      const isNew = days <= 3;
      return { dateStr, isNew };
    };
  }
  // Re-render if functions exist
  if (typeof w.filterArticles === "function" && typeof w.renderArticles === "function") {
    try {
      w.filterArticles();
      w.renderArticles();
    } catch (e) {}
  }
})();